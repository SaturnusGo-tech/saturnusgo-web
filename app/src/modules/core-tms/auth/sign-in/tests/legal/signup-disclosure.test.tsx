import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsLocaleContext } from "../../../../localization/context/TmsLocaleProvider";
import type { useSignIn } from "../../application/useSignIn";
void test("signup exposes current privacy and trial terms in the active language before continuing", async t => {
  const require = createRequire(import.meta.url), css = require.extensions[".css"];
  require.extensions[".css"] = module => { module.exports = {}; };
  const prior = Object.getOwnPropertyDescriptor(globalThis, "React"); Object.assign(globalThis, { React });
  t.after(() => {
    if (css) require.extensions[".css"] = css; else delete require.extensions[".css"];
    if (prior) Object.defineProperty(globalThis, "React", prior); else Reflect.deleteProperty(globalThis, "React");
  });
  const { SignInScreen } = await import("../../presentation/screen/SignInScreen");
  const signIn = { state: { step: "methods", loading: false, pending: false, error: null, methods: { google: true, email: true, saml: true, signup: true } } } as unknown as ReturnType<typeof useSignIn>;
  let view!: ReactTestRenderer;
  for (const locale of ["en", "ru"] as const) {
    const context = { locale, languageTag: locale === "ru" ? "ru-RU" as const : "en-US" as const, setLocale() {}, t: () => "" };
    await act(async () => { view = create(<TmsLocaleContext.Provider value={context}><SignInScreen signIn={signIn} signup /></TmsLocaleContext.Provider>); });
    const links = view.root.findAllByType("a").map(link => link.props.href);
    assert.ok(links.includes(`/privacy/?lang=${locale}`));
    assert.ok(links.includes(`/trial-terms/?lang=${locale}`));
    await act(async () => { view.update(<TmsLocaleContext.Provider value={context}><SignInScreen signIn={signIn} /></TmsLocaleContext.Provider>); });
    assert.equal(view.root.findAllByType("a").some(link => String(link.props.href).startsWith("/trial-terms/")), false);
    await act(async () => view.unmount());
  }
});
