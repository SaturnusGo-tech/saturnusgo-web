import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test, { type TestContext } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsLocaleContext } from "../../../../localization/context/TmsLocaleProvider";
import type { useSignIn } from "../../application/useSignIn";
import type { useManagedAccess } from "../../../managed/application/useManagedAccess";

const signIn: ReturnType<typeof useSignIn> = {
  state: { step: "methods", loading: false, pending: false, error: null, email: "", challenge: null,
    retryAt: 0, destination: null, methods: { google: true, email: true, saml: true, signup: true } },
  select() {}, back() {}, retryMethods() {}, startEmail: async () => {}, resend: async () => {},
  verify: async () => {}, google: async () => {}, saml: async () => {},
};
const access: ReturnType<typeof useManagedAccess> = {
  state: { loading: false, pending: false, session: { authenticated: false, stage: "anonymous" },
    entrypoint: { name: "Alpha", hostname: "alpha-falcon.example.test", audience: "tenant", available: true, accessContact: null },
    error: null, enrollment: null, recoveryCodes: [] },
  refresh: async () => {}, prepareMfa: async () => {}, login: async () => {}, firstPassword: async () => {},
  verify: async () => {}, logout: async () => {}, acknowledgeCodes() {},
};
const destinations = [
  { locale: "en", home: "/?lang=en", login: "/cloud-login/?lang=en", signup: "/signup/?lang=en", central: "https://tms.saturnusgo.com/signup/?lang=en" },
  { locale: "ru", home: "/?lang=ru", login: "/cloud-login/?lang=ru", signup: "/signup/?lang=ru", central: "https://tms.saturnusgo.com/signup/?lang=ru" },
] as const;
async function harness(t: TestContext) {
  const require = createRequire(import.meta.url), css = require.extensions[".css"];
  require.extensions[".css"] = module => { module.exports = {}; };
  const prior = ["React", "window", "document"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  const browser = Object.assign(new EventTarget(), { location: new URL("https://alpha-falcon.example.test/cloud-login/") });
  Object.assign(globalThis, { React, window: browser, document: { title: "Войти в Falcon" } });
  let view: ReactTestRenderer | null = null;
  t.after(async () => {
    await act(async () => view?.unmount());
    if (css) require.extensions[".css"] = css; else delete require.extensions[".css"];
    for (const [key, descriptor] of prior) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); }
  });
  return { browser, render: async (node: React.ReactElement) => {
    const content = <>{node}</>;
    await act(async () => { if (view) view.update(content); else view = create(content); });
    return view!;
  } };
}
function localized(locale: "en" | "ru", node: React.ReactElement) {
  return <TmsLocaleContext.Provider value={{ locale, languageTag: locale === "ru" ? "ru-RU" : "en-US", setLocale() {}, t: () => "" }}>{node}</TmsLocaleContext.Provider>;
}
void test("auth home and login/signup links retain the active language without copying proof parameters", async t => {
  const { browser, render } = await harness(t);
  const { SignInScreen } = await import("../../presentation/screen/SignInScreen");
  for (const expected of destinations) {
    browser.location.search = `?lang=${expected.locale === "en" ? "ru" : "en"}&challengeId=private-proof&email=private%40example.test&provider=google`;
    for (const signup of [false, true]) {
      const view = await render(localized(expected.locale, <SignInScreen signIn={signIn} signup={signup} />));
      assert.equal(view.root.findByProps({ "aria-label": "Falcon" }).props.href, expected.home);
      assert.equal(view.root.findByType("footer").findByType("a").props.href, signup ? expected.login : expected.signup);
    }
  }
});
void test("tenant signup carries only the active language to the central host", async t => {
  const { browser, render } = await harness(t);
  const { ManagedAccessScreen } = await import("../../../managed/presentation/screen/ManagedAccessScreen");
  for (const expected of destinations) {
    browser.location.search = `?lang=${expected.locale === "en" ? "ru" : "en"}&challengeId=private-proof&email=private%40example.test&provider=google`;
    const view = await render(localized(expected.locale, <ManagedAccessScreen access={access} signIn={signIn} />));
    assert.equal(view.root.findByProps({ "aria-label": "Falcon" }).props.href, expected.home);
    assert.equal(view.root.findByType("footer").findByType("a").props.href, expected.central);
  }
});
void test("trial terms return to signup in the displayed language without carrying incoming auth parameters", async t => {
  const { browser, render } = await harness(t);
  const { FalconTrialTermsPage } = await import("../../../../../core-falcon-public/trial-terms/FalconTrialTermsPage");
  for (const expected of destinations) {
    browser.location.search = `?lang=${expected.locale}&challengeId=private-proof&email=private%40example.test&provider=google`;
    const view = await render(<FalconTrialTermsPage />);
    await act(async () => { browser.dispatchEvent(new Event("popstate")); });
    assert.equal(view.root.findAllByType("footer")[0].findAllByType("a")[1].props.href, expected.signup);
  }
});
void test("auth tab titles replace stale Russian metadata and follow the active language", async t => {
  const { render } = await harness(t);
  const { SignInScreen } = await import("../../presentation/screen/SignInScreen");
  const { ManagedAccessScreen } = await import("../../../managed/presentation/screen/ManagedAccessScreen");
  await render(localized("en", <SignInScreen signIn={signIn} />));
  assert.equal(document.title, "Log in to Falcon");
  await render(localized("ru", <SignInScreen signIn={signIn} />));
  assert.equal(document.title, "Войти в Falcon");
  const sandbox = { ...access, state: { ...access.state, entrypoint: { ...access.state.entrypoint!, audience: "platform" as const } } };
  document.title = "Sandbox · Управление Falcon";
  await render(localized("en", <ManagedAccessScreen access={sandbox} />));
  assert.equal(document.title, "Sandbox · Falcon administration");
  await render(localized("ru", <ManagedAccessScreen access={sandbox} />));
  assert.equal(document.title, "Sandbox · Управление Falcon");
});
