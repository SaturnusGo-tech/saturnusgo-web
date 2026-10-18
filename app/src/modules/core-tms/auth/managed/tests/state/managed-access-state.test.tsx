import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useManagedAccess } from "../../application/useManagedAccess";
import type { ManagedAccessPort } from "../../application/managed-access-port";
import { CompanyAccessError, type CompanyEntrypoint, type CompanySession } from "../../domain/managed-access";
import { TmsLocaleContext } from "../../../../localization/context/TmsLocaleProvider";

let current: ReturnType<typeof useManagedAccess>;
function Probe({ client }: { client: ManagedAccessPort }) { current = useManagedAccess(client); return null; }
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
const entry: CompanyEntrypoint = { name: "Alpha", hostname: "alpha-falcon.example.test", audience: "tenant", available: true, accessContact: "admin@example.test" };
const anonymous: CompanySession = { authenticated: false, stage: "anonymous" };
const clientFixture = (): ManagedAccessPort => ({
  entrypoint: async () => entry, session: async () => anonymous, login: async () => {}, firstPassword: async () => {},
  prepareMfa: async () => ({ secret: "fixture-secret", uri: "otpauth://totp/fixture", issuer: "Falcon", account: "fixture" }),
  verifyMfa: async () => ({ stage: "authenticated", expiresAt: new Date().toISOString(), recoveryCodes: [] }), logout: async () => {},
});

void test("a late entrypoint response cannot replace a newer tenant after cancellation", async () => {
  const slow = deferred<CompanyEntrypoint>();
  let signal: AbortSignal | undefined;
  const first = { ...clientFixture(), entrypoint: (value?: AbortSignal) => { signal = value; return slow.promise; } };
  const second = { ...clientFixture(), entrypoint: async () => ({ ...entry, name: "Bravo", hostname: "bravo-falcon.example.test" }) };
  let renderer!: ReactTestRenderer;
  await act(async () => { renderer = create(<Probe client={first} />); });
  await act(async () => { renderer.update(<Probe client={second} />); });
  assert.equal(signal?.aborted, true);
  assert.equal(current.state.entrypoint?.name, "Bravo");
  await act(async () => { slow.resolve(entry); });
  assert.equal(current.state.entrypoint?.name, "Bravo");
  await act(async () => renderer.unmount());
});

void test("login is single-flight and logout failures reach the authenticated shell", async () => {
  const gate = deferred<void>(); let logins = 0;
  const client = { ...clientFixture(), login: async () => { logins += 1; await gate.promise; },
    logout: async () => { throw new CompanyAccessError("SERVICE_UNAVAILABLE"); } };
  let renderer!: ReactTestRenderer;
  await act(async () => { renderer = create(<Probe client={client} />); });
  let login!: Promise<void>;
  await act(async () => { login = current.login("tester", "secret"); void current.login("tester", "secret"); });
  assert.equal(logins, 1); assert.equal(current.state.pending, true);
  await act(async () => { gate.resolve(); await login; });
  assert.equal(current.state.pending, false);
  await act(async () => { await assert.rejects(current.logout(), { code: "SERVICE_UNAVAILABLE" }); });
  assert.equal(current.state.error, "SERVICE_UNAVAILABLE");
  await act(async () => renderer.unmount());
});

void test("recovery codes are discarded after acknowledgement and a new mounted session", async () => {
  const client = { ...clientFixture(), verifyMfa: async () => ({ stage: "authenticated" as const,
    expiresAt: new Date().toISOString(), recoveryCodes: ["one-time-fixture-code"] }) };
  let renderer!: ReactTestRenderer;
  await act(async () => { renderer = create(<Probe client={client} />); });
  await act(async () => { await current.verify("totp", "123456"); });
  assert.deepEqual(current.state.recoveryCodes, ["one-time-fixture-code"]);
  await act(async () => current.acknowledgeCodes());
  assert.deepEqual(current.state.recoveryCodes, []);
  await act(async () => renderer.unmount());
  await act(async () => { renderer = create(<Probe client={client} />); });
  assert.deepEqual(current.state.recoveryCodes, []);
  await act(async () => renderer.unmount());
});

void test("an expired MFA challenge clears its secret and returns to company login", async () => {
  const client = { ...clientFixture(), session: async (): Promise<CompanySession> => ({ authenticated: false,
    stage: "mfa_enrollment", expiresAt: new Date(Date.now() + 60000).toISOString() }),
    verifyMfa: async () => { throw new CompanyAccessError("SESSION_REQUIRED"); } };
  let renderer!: ReactTestRenderer;
  await act(async () => { renderer = create(<Probe client={client} />); });
  await act(async () => { await current.prepareMfa(); });
  assert.ok(current.state.enrollment);
  await act(async () => { await current.verify("totp", "123456"); });
  assert.equal(current.state.session?.stage, "anonymous");
  assert.equal(current.state.enrollment, null);
  assert.deepEqual(current.state.recoveryCodes, []);
  await act(async () => renderer.unmount());
});

void test("managed session restoration shows only the shared loader until the session is verified", async (t) => {
  const require = createRequire(import.meta.url);
  const previousCss = require.extensions[".css"];
  require.extensions[".css"] = module => { module.exports = {}; };
  const previousReact = Object.getOwnPropertyDescriptor(globalThis, "React");
  Object.assign(globalThis, { React });
  const previousFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = previousFetch;
    if (previousCss) require.extensions[".css"] = previousCss; else delete require.extensions[".css"];
    if (previousReact) Object.defineProperty(globalThis, "React", previousReact); else Reflect.deleteProperty(globalThis, "React");
  });
  const { ManagedAccessBoundary } = await import("../../composition/ManagedAccessBoundary");
  const entrypoint = deferred<Response>();
  const session = deferred<Response>();
  const paths: string[] = [];
  globalThis.fetch = async (path) => {
    paths.push(String(path));
    return path === "/api/v1/auth/entrypoint" ? entrypoint.promise : session.promise;
  };
  const locale = { locale: "en" as const, languageTag: "en-US" as const, setLocale: () => {}, t: () => "Loading session" };
  const signedIn: CompanySession = { authenticated: true, stage: "authenticated", audience: "tenant",
    workspaceId: "alpha", capabilities: [], expiresAt: new Date(Date.now() + 60000).toISOString(),
    identity: { id: "qa", name: "QA", login: "qa", email: "qa@example.test", emailVerified: true,
      phone: "", role: "tester", owner: false, hasAvatar: false, version: 1 } };
  let renderer!: ReactTestRenderer;
  t.after(() => act(() => renderer.unmount()));
  await act(async () => { renderer = create(<TmsLocaleContext.Provider value={locale}>
    <ManagedAccessBoundary>{() => <div data-testid="protected-workspace" />}</ManagedAccessBoundary>
  </TmsLocaleContext.Provider>); });
  const assertRestoring = () => {
    assert.equal(renderer.root.findAllByProps({ "data-testid": "auth-session-loading" }).length, 1);
    assert.equal(renderer.root.findAllByProps({ "data-testid": "protected-workspace" }).length, 0);
    assert.equal(renderer.root.findAllByType("form").length, 0);
    assert.equal(renderer.root.findAllByType("aside").length, 0, "authorization artwork must stay hidden during restoration");
  };
  assertRestoring();
  await act(async () => { entrypoint.resolve(Response.json({ data: entry })); });
  assert.deepEqual(paths, ["/api/v1/auth/entrypoint", "/api/v1/auth/session"]);
  assertRestoring();
  await act(async () => { session.resolve(Response.json({ data: signedIn })); });
  assert.equal(renderer.root.findAllByProps({ "data-testid": "auth-session-loading" }).length, 0);
  assert.equal(renderer.root.findAllByProps({ "data-testid": "protected-workspace" }).length, 1);
  assert.equal(renderer.root.findAllByType("aside").length, 0);

  const restrictedSessions: CompanySession[] = [anonymous,
    { authenticated: false, stage: "password_change", expiresAt: signedIn.expiresAt },
    { authenticated: false, stage: "mfa_challenge", expiresAt: signedIn.expiresAt }];
  for (const restricted of restrictedSessions) {
    await act(async () => renderer.unmount());
    globalThis.fetch = async path => Response.json({ data: path === "/api/v1/auth/entrypoint" ? entry : restricted });
    await act(async () => { renderer = create(<TmsLocaleContext.Provider value={locale}>
      <ManagedAccessBoundary>{() => <div data-testid="protected-workspace" />}</ManagedAccessBoundary>
    </TmsLocaleContext.Provider>); });
    assert.equal(renderer.root.findAllByProps({ "data-testid": "protected-workspace" }).length, 0);
    assert.equal(renderer.root.findAllByType("form").length, 1, `${restricted.stage} must still require authorization`);
    assert.equal(renderer.root.findAllByProps({ "data-testid": "auth-session-loading" }).length, 0);
  }
});
