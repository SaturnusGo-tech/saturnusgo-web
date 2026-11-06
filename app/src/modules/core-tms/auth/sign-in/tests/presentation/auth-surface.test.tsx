import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test, { type TestContext } from "node:test";
import React from "react";
import { act, create } from "react-test-renderer";
import type { useSignIn } from "../../application/useSignIn";
import { signInCopy } from "../../presentation/copy/sign-in-copy";
import { TmsLocaleContext } from "../../../../localization/context/TmsLocaleProvider";
function setup(t: TestContext) {
  const require = createRequire(import.meta.url), css = require.extensions[".css"];
  const prior = Object.getOwnPropertyDescriptor(globalThis, "React"); Object.assign(globalThis, { React });
  require.extensions[".css"] = module => { module.exports = new Proxy({}, { get: (_target, key) => key === "__esModule" ? false : String(key) }); };
  t.after(() => {
    if (css) require.extensions[".css"] = css; else delete require.extensions[".css"];
    if (prior) Object.defineProperty(globalThis, "React", prior); else Reflect.deleteProperty(globalThis, "React");
  });
}
void test("auth loading fills its own black viewport independently of workspace header-grid styles", async t => {
  setup(t);
  const { TmsAuthState } = await import("../../../presentation/state/TmsAuthState");
  let view!: ReturnType<typeof create>;
  const locale = { locale: "en" as const, languageTag: "en-US" as const, setLocale() {}, t: () => "Loading Falcon" };
  await act(async () => { view = create(<TmsLocaleContext.Provider value={locale}><TmsAuthState kind="loading" /></TmsLocaleContext.Provider>); });
  t.after(async () => { await act(async () => view.unmount()); });
  assert.equal(view.root.findByType("main").props.className, "viewport");
  assert.equal(view.root.findByProps({ role: "status" }).props["aria-busy"], "true");
  const css = readFileSync(new URL("../../../presentation/state/auth-state.module.css", import.meta.url), "utf8");
  assert.match(css, /position:\s*fixed/); assert.match(css, /inset:\s*0/);
  assert.match(css, /height:\s*100dvh/); assert.match(css, /background:\s*#000/);
  assert.match(css, /--canvas:\s*#000/);
});
void test("only corporate SAML is primary; Google and email stay secondary with their actions intact", async t => {
  setup(t);
  const { SignInMethods } = await import("../../presentation/methods/SignInMethods");
  const calls: string[] = [];
  const signIn = { state: { methods: { google: true, email: true, saml: true, signup: true }, pending: false, loading: false },
    google: () => { calls.push("google"); }, select: (method: string) => { calls.push(method); } } as unknown as ReturnType<typeof useSignIn>;
  let view!: ReturnType<typeof create>;
  await act(async () => { view = create(<SignInMethods signIn={signIn} copy={signInCopy("en")} signup={false} />); });
  t.after(async () => { await act(async () => view.unmount()); });
  const buttons = view.root.findAllByType("button");
  assert.deepEqual(buttons.map(button => button.props.className), ["secondary", "secondary", "primary"]);
  await act(async () => { for (const button of buttons) button.props.onClick(); });
  assert.deepEqual(calls, ["google", "email", "saml"]);
  await act(async () => { view.update(<SignInMethods signIn={signIn} copy={signInCopy("en")} signup />); });
  assert.deepEqual(view.root.findAllByType("button").map(button => button.props.className), ["secondary", "secondary"]);
});

void test("SAML unavailable explains company setup instead of asking the user to retry indefinitely", async t => {
  setup(t);
  const { SignInScreen } = await import("../../presentation/screen/SignInScreen");
  const discovered: string[] = [];
  const signIn = { state: { step: "saml", error: "FEDERATION_UNAVAILABLE", methods: { saml: true }, email: "" },
    company: async (organization: string) => { discovered.push(organization); } } as unknown as ReturnType<typeof useSignIn>;
  let view!: ReturnType<typeof create>;
  await act(async () => { view = create(<TmsLocaleContext.Provider value={{ locale: "en", languageTag: "en-US", setLocale() {}, t: () => "" }}>
    <SignInScreen signIn={signIn} /></TmsLocaleContext.Provider>); });
  t.after(async () => { await act(async () => view.unmount()); });
  assert.match(view.root.findByProps({ role: "alert" }).children.join(""), /SAML SSO is not configured/);
  await act(async () => view.root.findByType("input").props.onChange({ target: { value: "fixture-company" } }));
  const fallback = view.root.findAllByType("button").find(button => button.children.includes("Continue to company workspace"));
  assert.ok(fallback, "the SSO form itself must offer company discovery after unavailable SAML");
  await act(async () => fallback.props.onClick());
  assert.deepEqual(discovered, ["fixture-company"]);
});
