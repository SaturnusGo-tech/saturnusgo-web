import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsLocaleContext } from "../../../../localization/context/TmsLocaleProvider";
import type { CompanySession } from "../../../managed/domain/managed-access";
import { CONTINUATION_KEY } from "../../application/continuation-storage";
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
    const path = String(input); requests.push(path);
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
  assert.deepEqual(destinations, [deepPath]); assert.equal(values.has(CONTINUATION_KEY), false);
  assert.equal(view.root.findAllByProps({ "data-testid": "protected" }).length, 0);
  await act(async () => view.unmount());
  destinations.length = 0; browser.location = location(deepPath);
  await act(async () => { view = create(content()); });
  assert.deepEqual(destinations, ["/api/v1/falcon-oauth/interaction/consent_123"]);
  assert.equal(requests.some(path => /approve|consent/.test(path)), false, "resume must present the consent interaction, not approve it");
});
