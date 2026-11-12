import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsLocaleContext } from "../../../../localization/context/TmsLocaleProvider";
import type { useGoogleLink } from "../../application/useGoogleLink";
import { installSecurityControls } from "../../../../company-administration/tests/support/security-controls";

Object.assign(globalThis, { React });
test("Google availability renders a concise optional action row without claiming a linked provider", async () => {
  const require = createRequire(import.meta.url), previousCss = require.extensions[".css"];
  require.extensions[".css"] = module => { module.exports = {}; };
  const restoreControls = installSecurityControls();
  const { GoogleLinkAction } = require("../../presentation/GoogleLinkAction") as typeof import("../../presentation/GoogleLinkAction");
  restoreControls();
  const locale = { locale: "ru" as const, languageTag: "ru-RU" as const, setLocale() {}, t: () => "" };
  const model: ReturnType<typeof useGoogleLink> = { state: { available: true, pending: false, error: null, destination: null }, link: async () => {} };
  let view!: ReactTestRenderer;
  try {
    await act(async () => { view = create(<TmsLocaleContext.Provider value={locale}><GoogleLinkAction model={model} desktop/></TmsLocaleContext.Provider>); });
    assert.equal(view.root.findByType("h3").children.join(""), "Google");
    assert.doesNotMatch(JSON.stringify(view.toJSON()), /Подключён|Connected|Disconnect|Отключить/);
    assert.equal(view.root.findByType("a").props.href, "/desktop-open-profile/");
    await act(async () => { view.update(<TmsLocaleContext.Provider value={locale}><GoogleLinkAction model={{ ...model, state: { ...model.state, available: false } }} desktop/></TmsLocaleContext.Provider>); });
    assert.equal(view.toJSON(), null);
  } finally {
    await act(async () => view?.unmount());
    if (previousCss) require.extensions[".css"] = previousCss; else delete require.extensions[".css"];
  }
});
