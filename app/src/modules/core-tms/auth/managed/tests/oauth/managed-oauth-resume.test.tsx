import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test, type TestContext } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsLocaleContext } from "../../../../localization/context/TmsLocaleProvider";
import type { CompanySession } from "../../domain/managed-access";

const signedIn: Extract<CompanySession, { authenticated: true }> = { authenticated: true, stage: "authenticated", audience: "tenant",
  workspaceId: "alpha", capabilities: [], expiresAt: new Date(Date.now() + 60000).toISOString(),
  identity: { id: "qa", name: "QA", login: "qa", email: "qa@example.test", emailVerified: true,
    phone: "", role: "tester", owner: false, hasAvatar: false, version: 1 } };

async function page(t: TestContext, search: string, initial: CompanySession, codes: string[] = []) {
  const require = createRequire(import.meta.url);
  const oldCss = require.extensions[".css"];
  require.extensions[".css"] = module => { module.exports = {}; };
  const previous = ["window", "document", "React", "fetch"].map(key => [key,
    Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  const destinations: string[] = [];
  const browser = Object.assign(new EventTarget(), { location: { search, replace: (value: string) => destinations.push(value) },
    setTimeout, clearTimeout, setInterval, clearInterval });
  Object.defineProperty(globalThis, "window", { configurable: true, value: browser });
  Object.defineProperty(globalThis, "document", { configurable: true, value: Object.assign(new EventTarget(), { visibilityState: "visible" }) });
  Object.defineProperty(globalThis, "React", { configurable: true, value: React });
  let session = initial;
  globalThis.fetch = async input => {
    const path = String(input);
    if (path.endsWith("/entrypoint")) return Response.json({ data: { name: "Alpha", hostname: "alpha-falcon.example.test",
      audience: "tenant", available: true, accessContact: "admin@example.test" } });
    if (path.endsWith("/mfa/verify")) {
      session = signedIn;
      return Response.json({ data: { stage: "authenticated", expiresAt: signedIn.expiresAt, recoveryCodes: codes } });
    }
    return Response.json({ data: session });
  };
  const { ManagedAccessBoundary } = await import("../../composition/ManagedAccessBoundary");
  const { MfaForm } = await import("../../presentation/mfa/MfaForm");
  const { RecoveryCodes } = await import("../../presentation/mfa/RecoveryCodes");
  let renderer!: ReactTestRenderer;
  t.after(async () => {
    await act(async () => renderer.unmount());
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key);
    }
    if (oldCss) require.extensions[".css"] = oldCss; else delete require.extensions[".css"];
  });
  const locale = { locale: "en" as const, languageTag: "en-US" as const, setLocale: () => {}, t: () => "Loading session" };
  await act(async () => { renderer = create(<TmsLocaleContext.Provider value={locale}>
    <ManagedAccessBoundary>{() => <div data-testid="workspace-content" />}</ManagedAccessBoundary>
  </TmsLocaleContext.Provider>); });
  return { renderer, destinations, MfaForm, RecoveryCodes };
}

test("authenticated OAuth resume replaces the page with only the fixed same-company interaction path", async t => {
  const { renderer, destinations } = await page(t, "?falconMcpInteraction=opaque_123-UID&returnTo=https://evil.example/", signedIn);
  assert.deepEqual(destinations, ["/api/v1/falcon-oauth/interaction/opaque_123-UID"]);
  assert.equal(renderer.root.findAllByProps({ "data-testid": "workspace-content" }).length, 0);
  assert.equal(renderer.root.findAllByProps({ "data-testid": "auth-session-loading" }).length, 1);
});

test("ordinary and malformed resume URLs retain normal navigation without redirects", async t => {
  for (const search of ["", "?view=runs", "?falconMcpInteraction=", "?falconMcpInteraction=..%2F..%2Fprofile",
    "?falconMcpInteraction=https://evil.example", "?falconMcpInteraction=one&falconMcpInteraction=two",
    `?falconMcpInteraction=${"a".repeat(129)}`]) {
    await t.test(search || "ordinary", async sub => {
      const { renderer, destinations } = await page(sub, search, signedIn);
      assert.deepEqual(destinations, []);
      assert.equal(renderer.root.findAllByProps({ "data-testid": "workspace-content" }).length, 1);
    });
  }
});

test("OAuth cannot resume from anonymous, password-change or pending MFA stages", async t => {
  for (const stage of ["anonymous", "password_change", "mfa_enrollment", "mfa_challenge"] as const) {
    await t.test(stage, async sub => {
      const session: CompanySession = stage === "anonymous" ? { authenticated: false, stage }
        : { authenticated: false, stage, expiresAt: signedIn.expiresAt };
      const { renderer, destinations } = await page(sub, "?falconMcpInteraction=opaqueUID", session);
      assert.deepEqual(destinations, []);
      assert.equal(renderer.root.findAllByProps({ "data-testid": "workspace-content" }).length, 0);
      assert.equal(renderer.root.findAllByType("main").length, 1);
    });
  }
});

test("a platform session does not resume a tenant OAuth interaction", async t => {
  const { renderer, destinations } = await page(t, "?falconMcpInteraction=tenantOnlyUID", {
    ...signedIn, audience: "platform", workspaceId: null,
  });
  assert.deepEqual(destinations, []);
  assert.equal(renderer.root.findAllByProps({ "data-testid": "workspace-content" }).length, 1);
});

test("OAuth resumes only after MFA completes and recovery codes have been acknowledged", async t => {
  const state = await page(t, "?falconMcpInteraction=afterMfaUID", {
    authenticated: false, stage: "mfa_challenge", expiresAt: signedIn.expiresAt,
  }, ["one-time-fixture-code"]);
  await act(async () => { await state.renderer.root.findByType(state.MfaForm).props.onSubmit("totp", "123456"); });
  assert.deepEqual(state.destinations, []);
  assert.equal(state.renderer.root.findAllByType(state.RecoveryCodes).length, 1);
  await act(async () => state.renderer.root.findByType(state.RecoveryCodes).props.onContinue());
  assert.deepEqual(state.destinations, ["/api/v1/falcon-oauth/interaction/afterMfaUID"]);
  assert.equal(state.renderer.root.findAllByProps({ "data-testid": "workspace-content" }).length, 0);
});
