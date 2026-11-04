import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsLocaleContext } from "../../../../localization/context/TmsLocaleProvider";
import type { useGoogleLink } from "../../application/useGoogleLink";
void test("desktop linking opens the fixed profile command and never starts a provider in Electron", async t => {
  const require = createRequire(import.meta.url), previous = require.extensions[".css"];
  require.extensions[".css"] = module => { module.exports = {}; };
  const react = Object.getOwnPropertyDescriptor(globalThis, "React"); Object.assign(globalThis, { React });
  t.after(() => {
    if (previous) require.extensions[".css"] = previous; else delete require.extensions[".css"];
    if (react) Object.defineProperty(globalThis, "React", react); else Reflect.deleteProperty(globalThis, "React");
  });
  const { GoogleLinkAction } = await import("../../presentation/GoogleLinkAction");
  const locale = { locale: "en" as const, languageTag: "en-US" as const, setLocale() {}, t: () => "" };
  let linked = 0;
  const model: ReturnType<typeof useGoogleLink> = { state: { available: true, pending: false, error: null, destination: null }, link: async () => { linked++; } };
  let view!: ReactTestRenderer;
  await act(async () => { view = create(<TmsLocaleContext.Provider value={locale}><GoogleLinkAction model={model} desktop /></TmsLocaleContext.Provider>); });
  assert.equal(view.root.findByType("a").props.href, "/desktop-open-profile/");
  assert.equal(view.root.findAllByType("button").length, 0); assert.equal(linked, 0);
  await act(async () => { view.update(<TmsLocaleContext.Provider value={locale}><GoogleLinkAction model={model} desktop={false} /></TmsLocaleContext.Provider>); });
  await act(async () => view.root.findByType("button").props.onClick()); assert.equal(linked, 1);
  await act(async () => { view.update(<TmsLocaleContext.Provider value={locale}><GoogleLinkAction model={{ ...model, state: { ...model.state, available: false } }} desktop={false} /></TmsLocaleContext.Provider>); });
  assert.equal(view.toJSON(), null);
  await act(async () => view.unmount());
});
