import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsLocaleContext } from "../../../../localization/context/TmsLocaleProvider";
import type { CompanySession } from "../../../managed/domain/managed-access";
import { CONTINUATION_KEY } from "../../application/continuation-storage";
import { DESKTOP_ATTEMPT_KEY } from "../../desktop/attempt-storage";
import { clearBrowserDesktopAttempt } from "../../desktop/browser-desktop-attempt";
void test("provider return retains the deep case through MFA and recovery acknowledgement, then resumes MCP consent", async t => {
  const require = createRequire(import.meta.url), css = require.extensions[".css"];
  require.extensions[".css"] = module => { module.exports = {}; };
  const prior = ["window", "document", "React", "fetch"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  const origin = "https://alpha-falcon.example.test", deepPath = "/testcases/umbrella-home/work/?workspaceId=alpha&caseId=case-7&falconMcpInteraction=consent_123#step-2";
  const values = new Map<string, string>(), destinations: string[] = [], requests: string[] = [];
  const location = (path: string) => Object.assign(new URL(path, origin), { assign: (target: string) => destinations.push(target), replace: (target: string) => destinations.push(target) });
  const browser = Object.assign(new EventTarget(), { location: location(deepPath), setTimeout, clearTimeout, setInterval, clearInterval,
    sessionStorage: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } } });
  Object.defineProperty(globalThis, "window", { configurable: true, value: browser });
  Object.defineProperty(globalThis, "document", { configurable: true, value: Object.assign(new EventTarget(), { visibilityState: "visible" }) });
  Object.defineProperty(globalThis, "React", { configurable: true, value: React });
  const signedIn: Extract<CompanySession, { authenticated: true }> = { authenticated: true, stage: "authenticated", audience: "tenant", workspaceId: "alpha", capabilities: [], expiresAt: new Date(Date.now() + 60000).toISOString(),
    identity: { id: "qa", name: "QA", login: "qa", email: "qa@example.test", emailVerified: true, phone: "", role: "tester", owner: false, hasAvatar: false, version: 1 } };
  let session: CompanySession = { authenticated: false, stage: "anonymous" };
  globalThis.fetch = async input => {
    requests.push(String(input)); const path = new URL(String(input), origin).pathname;
    if (path.endsWith("/entrypoint")) return Response.json({ data: { name: "Alpha", hostname: "alpha-falcon.example.test", audience: "tenant", available: true, accessContact: "" } });
    if (path.endsWith("/methods")) return Response.json({ data: { google: true, email: true, saml: true, signup: true } });
    if (path.endsWith("/google/start")) return Response.json({ data: { authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth?state=fixture" } });
    if (path.endsWith("/mfa/verify")) { session = signedIn; return Response.json({ data: { stage: "authenticated", expiresAt: signedIn.expiresAt, recoveryCodes: ["recovery-fixture"] } }); }
    return Response.json({ data: session });
  };
  const { ManagedAccessBoundary } = await import("../../../managed/composition/ManagedAccessBoundary");
  const { MfaForm } = await import("../../../managed/presentation/mfa/MfaForm");
  const { RecoveryCodes } = await import("../../../managed/presentation/mfa/RecoveryCodes");
  const locale = { locale: "en" as const, languageTag: "en-US" as const, setLocale() {}, t: () => "Loading" };
  const content = () => <TmsLocaleContext.Provider value={locale}><ManagedAccessBoundary>{() => <div data-testid="protected" />}</ManagedAccessBoundary></TmsLocaleContext.Provider>;
  let view!: ReactTestRenderer;
  t.after(async () => {
    await act(async () => view?.unmount());
    for (const [key, descriptor] of prior) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); }
    if (css) require.extensions[".css"] = css; else delete require.extensions[".css"];
  });
  await act(async () => { view = create(content()); });
  const google = view.root.findAllByType("button").find(button => button.children.includes("Continue with Google"));
  assert.ok(google); await act(async () => google.props.onClick());
  assert.ok(values.has(CONTINUATION_KEY), "leaving for Google must preserve the validated per-tab workspace target");
  assert.deepEqual(destinations, ["https://accounts.google.com/o/oauth2/v2/auth?state=fixture"]);
  await act(async () => view.unmount());
  destinations.length = 0; browser.location = location("/testcases/umbrella-home/work/");
  session = { authenticated: false, stage: "mfa_challenge", expiresAt: signedIn.expiresAt };
  await act(async () => { view = create(content()); });
  assert.deepEqual(destinations, []); assert.ok(values.has(CONTINUATION_KEY));
  await act(async () => { await view.root.findByType(MfaForm).props.onSubmit("totp", "123456"); });
  assert.deepEqual(destinations, []); assert.ok(values.has(CONTINUATION_KEY));
  await act(async () => view.root.findByType(RecoveryCodes).props.onContinue());
  assert.deepEqual(destinations, ["/work/?workspaceId=alpha&caseId=case-7&falconMcpInteraction=consent_123#step-2"]); assert.equal(values.has(CONTINUATION_KEY), false);
  assert.equal(view.root.findAllByProps({ "data-testid": "protected" }).length, 0);
  await act(async () => view.unmount());
  destinations.length = 0; browser.location = location(deepPath);
  await act(async () => { view = create(content()); });
  assert.deepEqual(destinations, ["/api/v1/falcon-oauth/interaction/consent_123"]);
  assert.equal(requests.some(path => /approve|consent/.test(path)), false, "resume must present the consent interaction, not approve it");
});

void test("company auth Worker redirect preserves the desktop entry through MFA and recovery acknowledgement", async t => {
  const require = createRequire(import.meta.url), css = require.extensions[".css"];
  require.extensions[".css"] = module => { module.exports = {}; };
  const prior = ["window", "document", "React", "fetch"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  const origin = "https://alpha-falcon.example.test", attempt = "d".repeat(43), destinations: string[] = [];
  const values = new Map<string, string>();
  const mcp = JSON.stringify({ version: 1, origin, createdAt: Date.now(), path: "/testcases/umbrella-home/work/?falconMcpInteraction=savedConsent" });
  values.set(CONTINUATION_KEY, mcp);
  const location = (path: string) => Object.assign(new URL(path, origin), { assign: (target: string) => destinations.push(target), replace: (target: string) => destinations.push(target) });
  const browser = Object.assign(new EventTarget(), { location: location("/"), setTimeout, clearTimeout, setInterval, clearInterval,
    history: { state: {}, replaceState(_state: unknown, _title: string, path: string) { browser.location = location(path); } },
    sessionStorage: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } } });
  Object.defineProperty(globalThis, "window", { configurable: true, value: browser });
  Object.defineProperty(globalThis, "document", { configurable: true, value: Object.assign(new EventTarget(), { visibilityState: "visible", title: "Falcon" }) });
  Object.defineProperty(globalThis, "React", { configurable: true, value: React });
  const signedIn: Extract<CompanySession, { authenticated: true }> = { authenticated: true, stage: "authenticated", audience: "tenant", workspaceId: "alpha", capabilities: [], expiresAt: new Date(Date.now() + 60000).toISOString(),
    identity: { id: "qa", name: "QA", login: "qa", email: "qa@example.test", emailVerified: true, phone: "", role: "tester", owner: false, hasAvatar: false, version: 1 } };
  const previousAdmin: CompanySession = { ...signedIn, identity: { ...signedIn.identity, id: "admin", role: "workspace_admin", owner: true } };
  let session: CompanySession = previousAdmin;
  let sessionReads = 0;
  globalThis.fetch = async input => {
    const path = new URL(String(input instanceof Request ? input.url : input), origin).pathname;
    if (path.endsWith("/entrypoint")) return Response.json({ data: { name: "Alpha", hostname: "alpha-falcon.example.test", audience: "tenant", available: true, accessContact: "" } });
    if (path.endsWith("/methods")) return Response.json({ data: { google: true, email: true, saml: true, signup: true } });
    if (path.endsWith("/google/start")) return Response.json({ data: { authorizationUrl: "https://accounts.google.com/authorize" } });
    if (path.endsWith("/mfa/verify")) { session = signedIn; return Response.json({ data: { stage: "authenticated", expiresAt: signedIn.expiresAt, recoveryCodes: ["recovery-fixture"] } }); }
    if (path.endsWith("/session")) sessionReads += 1;
    return Response.json({ data: session });
  };
  const { default: worker } = await import(new URL("../../../../../../../../infrastructure/cloudflare/tms-origin/worker.mjs", import.meta.url).href);
  const response = await worker.fetch(new Request(`${origin}/cloud-login/?desktopAttempt=${attempt}`), {
    FALCON_MANAGED_AUTH_ENABLED: "true", FALCON_COMPANY_DOMAIN_SUFFIX: "example.test", FALCON_PLATFORM_HOSTNAME: "sandbox-falcon.example.test",
    FALCON_MANAGED_GATEWAY_KEY: "07".repeat(32), FALCON_API_ORIGIN: "https://api.example.test",
  });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), `${origin}/work/?desktopAttempt=${attempt}&desktopFresh=1`);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const ordinary = await worker.fetch(new Request(`${origin}/cloud-login/`), {
    FALCON_MANAGED_AUTH_ENABLED: "true", FALCON_COMPANY_DOMAIN_SUFFIX: "example.test", FALCON_PLATFORM_HOSTNAME: "sandbox-falcon.example.test",
    FALCON_MANAGED_GATEWAY_KEY: "07".repeat(32), FALCON_API_ORIGIN: "https://api.example.test",
  });
  assert.equal(ordinary.headers.get("location"), `${origin}/work/`);
  browser.location = location(response.headers.get("location")!);
  const { ManagedAccessBoundary } = await import("../../../managed/composition/ManagedAccessBoundary");
  const { MfaForm } = await import("../../../managed/presentation/mfa/MfaForm");
  const { RecoveryCodes } = await import("../../../managed/presentation/mfa/RecoveryCodes");
  const locale = { locale: "en" as const, languageTag: "en-US" as const, setLocale() {}, t: () => "Loading" };
  const content = () => <TmsLocaleContext.Provider value={locale}><ManagedAccessBoundary>{() => <div data-testid="protected" />}</ManagedAccessBoundary></TmsLocaleContext.Provider>;
  let view!: ReactTestRenderer;
  t.after(async () => {
    await act(async () => view?.unmount()); clearBrowserDesktopAttempt();
    for (const [key, descriptor] of prior) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); }
    if (css) require.extensions[".css"] = css; else delete require.extensions[".css"];
  });
  await act(async () => { view = create(content()); });
  assert.equal(browser.location.search, "?desktopFresh=1"); assert.ok(values.has(DESKTOP_ATTEMPT_KEY));
  assert.equal(sessionReads, 0, "the desktop sign-in entry must not reuse the previous administrator's browser session");
  assert.deepEqual(destinations, []);
  assert.equal(view.root.findAllByProps({ "data-testid": "protected" }).length, 0);
  await act(async () => view.root.findAllByType("button").find(button => button.children.includes("Continue with Google"))!.props.onClick());
  await act(async () => view.unmount()); destinations.length = 0; browser.location = location("/testcases/umbrella-home/work/");
  session = { authenticated: false, stage: "mfa_challenge", expiresAt: signedIn.expiresAt };
  await act(async () => { view = create(content()); });
  assert.deepEqual(destinations, []); assert.ok(values.has(DESKTOP_ATTEMPT_KEY));
  await act(async () => { await view.root.findByType(MfaForm).props.onSubmit("totp", "123456"); });
  assert.deepEqual(destinations, []); assert.ok(values.has(DESKTOP_ATTEMPT_KEY));
  await act(async () => view.root.findByType(RecoveryCodes).props.onContinue());
  assert.deepEqual(destinations, [`/api/v1/auth/desktop/authorize?attempt=${attempt}&workspaceId=alpha`]);
  assert.equal(values.has(DESKTOP_ATTEMPT_KEY), false); assert.equal(values.get(CONTINUATION_KEY), mcp);
  assert.equal(view.root.findAllByProps({ "data-testid": "protected" }).length, 0);
  await act(async () => view.unmount()); destinations.length = 0;
  const fresh = "e".repeat(43); browser.location = location(`/testcases/umbrella-home/work/?desktopAttempt=${fresh}`);
  await act(async () => { view = create(content()); });
  assert.deepEqual(destinations, [`/api/v1/auth/desktop/authorize?attempt=${fresh}&workspaceId=alpha`], "an existing authenticated company browser also returns to the app");
  await act(async () => view.unmount()); destinations.length = 0;
  browser.location = location(`/testcases/umbrella-home/work/?desktopAttempt=${"f".repeat(43)}`);
  session = { authenticated: false, stage: "mfa_challenge", expiresAt: signedIn.expiresAt };
  await act(async () => { view = create(content()); });
  assert.ok(values.has(DESKTOP_ATTEMPT_KEY));
  await act(async () => view.root.findAllByType("button").find(button => button.children.includes("Back to sign-in"))!.props.onClick());
  assert.equal(values.has(DESKTOP_ATTEMPT_KEY), false, "explicit company sign-in cancellation clears app continuation");
  assert.deepEqual(destinations, [`${origin}/cloud-login/?lang=en`], "successful cancellation leaves the company sign-in flow");
});
