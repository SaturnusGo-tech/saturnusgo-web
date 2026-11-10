import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsLocaleContext } from "../../../../localization/context/TmsLocaleProvider";
import type { useSignIn } from "../../application/useSignIn";
void test("personal signup requires accepting localized legal terms before starting Google or email", async t => {
  const require = createRequire(import.meta.url), css = require.extensions[".css"];
  require.extensions[".css"] = module => { module.exports = {}; };
  const prior = Object.getOwnPropertyDescriptor(globalThis, "React"); Object.assign(globalThis, { React });
  t.after(() => {
    if (css) require.extensions[".css"] = css; else delete require.extensions[".css"];
    if (prior) Object.defineProperty(globalThis, "React", prior); else Reflect.deleteProperty(globalThis, "React");
  });
  const { SignInScreen } = await import("../../presentation/screen/SignInScreen");
  const state = { step: "methods", email: "", loading: false, pending: false, error: null, methods: { google: true, email: true, saml: true, signup: true } };
  const signIn = { state } as unknown as ReturnType<typeof useSignIn>;
  let view!: ReactTestRenderer;
  for (const locale of ["en", "ru"] as const) {
    const context = { locale, languageTag: locale === "ru" ? "ru-RU" as const : "en-US" as const, setLocale() {}, t: () => "" };
    await act(async () => { view = create(<TmsLocaleContext.Provider value={context}><SignInScreen signIn={signIn} signup /></TmsLocaleContext.Provider>); });
    const legalLinks = view.root.findAllByType("a").filter(link => link.props.target === "_blank");
    assert.deepEqual(legalLinks.map(link => link.props.href), ["terms", "billing-terms", "privacy"].map(page => `/${page}/?lang=${locale}`));
    const checkboxes = () => view.root.findAllByType("input").filter(input => input.props.type === "checkbox");
    const [checkbox] = checkboxes();
    const methods = () => view.root.findAllByType("button").filter(button => button.props.disabled !== undefined);
    assert.equal(checkbox.props.required, true);
    assert.equal(checkbox.props.checked, false);
    assert.ok(legalLinks.every(link => link.parent?.props.id === checkbox.props["aria-labelledby"]));
    assert.deepEqual(methods().map(button => button.props.disabled), [true, true]);
    await act(async () => checkbox.props.onChange({ target: { checked: true } }));
    assert.deepEqual(methods().map(button => button.props.disabled), [false, false]);
    await act(async () => checkbox.props.onChange({ target: { checked: false } }));
    assert.deepEqual(methods().map(button => button.props.disabled), [true, true]);
    for (const step of ["email", "code"]) {
      const continuation = { ...signIn, state: { ...state, step } } as ReturnType<typeof useSignIn>;
      await act(async () => { view.update(<TmsLocaleContext.Provider value={context}><SignInScreen signIn={continuation} signup /></TmsLocaleContext.Provider>); });
      assert.equal(checkboxes().length, 0);
      assert.equal(view.root.findAllByType("a").filter(link => link.props.target === "_blank").length, 0);
    }
    await act(async () => { view.update(<TmsLocaleContext.Provider value={context}><SignInScreen signIn={signIn} /></TmsLocaleContext.Provider>); });
    assert.equal(checkboxes().length, 0);
    assert.deepEqual(methods().slice(0, 2).map(button => button.props.disabled), [false, false]);
    await act(async () => view.unmount());
  }
});
