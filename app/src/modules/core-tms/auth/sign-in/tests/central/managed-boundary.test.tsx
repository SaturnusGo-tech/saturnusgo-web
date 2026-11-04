import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsLocaleContext } from "../../../../localization/context/TmsLocaleProvider";
import type { CompanySession } from "../../../managed/domain/managed-access";

void test("operator sign-in opens password and MFA directly without company federation; tenants retain method choice", async t => {
  const require = createRequire(import.meta.url), css = require.extensions[".css"];
  require.extensions[".css"] = module => { module.exports = {}; };
  const prior = ["window", "document", "React", "fetch"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  const requests: string[] = [];
  let audience: "platform" | "tenant" = "platform";
  let session: CompanySession = { authenticated: false, stage: "anonymous" };
  const expiresAt = new Date(Date.now() + 600_000).toISOString();
  const location = new URL("https://sandbox-falcon.example.test/sandbox/");
  Object.defineProperty(globalThis, "window", { configurable: true, value: Object.assign(new EventTarget(), {
    location, setTimeout, clearTimeout, setInterval, clearInterval,
  }) });
  Object.defineProperty(globalThis, "document", { configurable: true, value: Object.assign(new EventTarget(), { visibilityState: "visible" }) });
  Object.defineProperty(globalThis, "React", { configurable: true, value: React });
  globalThis.fetch = async (input, init) => {
    const path = String(input); requests.push(path);
    if (path.endsWith("/entrypoint")) return Response.json({ data: { name: "Falcon Sandbox", hostname: location.hostname, audience, available: true, accessContact: null } });
    if (path.endsWith("/methods")) return audience === "platform"
      ? Response.json({ error: { code: "NOT_FOUND", message: "Not found", requestId: "fixture" } }, { status: 404 })
      : Response.json({ data: { google: true, email: true, saml: true, signup: true } });
    if (path.endsWith("/login")) {
      assert.equal(init?.method, "POST");
      assert.deepEqual(JSON.parse(String(init?.body)), { login: "operator-fixture", password: "fixture-password" });
      session = { authenticated: false, stage: "mfa_challenge", expiresAt };
      return Response.json({ data: session });
    }
    return Response.json({ data: session });
  };
  const { ManagedAccessBoundary } = await import("../../../managed/composition/ManagedAccessBoundary");
  const locale = { locale: "en" as const, languageTag: "en-US" as const, setLocale() {}, t: () => "Loading" };
  const content = () => <TmsLocaleContext.Provider value={locale}><ManagedAccessBoundary>{() => <div data-testid="protected" />}</ManagedAccessBoundary></TmsLocaleContext.Provider>;
  let view!: ReactTestRenderer;
  t.after(async () => {
    await act(async () => view?.unmount());
    for (const [key, descriptor] of prior) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); }
    if (css) require.extensions[".css"] = css; else delete require.extensions[".css"];
  });
  await act(async () => { view = create(content()); });
  assert.equal(view.root.findAllByProps({ name: "username" }).filter(node => node.type === "input").length, 1, "the operator must reach password sign-in without a method-choice detour");
  assert.equal(view.root.findAllByProps({ type: "password" }).filter(node => node.type === "input").length, 1);
  assert.equal(view.root.findByType("h1").children.join(""), "Sandbox · Falcon administration");
  assert.equal(view.root.findAllByType("a").some(link => link.props.href?.includes("/signup/")), false);
  assert.equal(view.root.findAllByProps({ role: "alert" }).length, 0);
  assert.equal(requests.some(path => path.endsWith("/methods")), false, "platform hosts have no federation-method endpoint");
  await act(async () => {
    view.root.findAllByType("input").find(input => input.props.name === "username")!.props.onChange({ target: { value: "operator-fixture" } });
    view.root.findAllByType("input").find(input => input.props.name === "password")!.props.onChange({ target: { value: "fixture-password" } });
  });
  await act(async () => { view.root.findByType("form").props.onSubmit({ preventDefault() {} }); });
  assert.equal(view.root.findByType("h1").children.join(""), "Confirm sign-in");
  assert.equal(view.root.findAllByType("input").filter(input => input.props.autoComplete === "one-time-code").length, 1);
  assert.equal(view.root.findAllByProps({ "data-testid": "protected" }).length, 0, "password does not bypass operator MFA");
  await act(async () => view.unmount());
  audience = "tenant"; session = { authenticated: false, stage: "anonymous" }; requests.length = 0;
  await act(async () => { view = create(content()); });
  assert.ok(view.root.findAllByType("button").some(button => button.children.includes("Continue with Google")));
  assert.equal(view.root.findAllByType("input").some(input => input.props.name === "password"), false);
  assert.equal(requests.filter(path => path.endsWith("/methods")).length, 1);
});
