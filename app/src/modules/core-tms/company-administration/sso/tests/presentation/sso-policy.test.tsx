import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsLocaleContext } from "../../../../localization/context/TmsLocaleProvider";
import type { useCompanySso } from "../../application/useCompanySso";
import type { AdministrationPort } from "../../../application/ports/administration-port";

void test("SSO requires a tested enabled configuration and explicit recovery acknowledgement before enforcement", async t => {
  const require = createRequire(import.meta.url);
  const css = require.extensions[".css"];
  require.extensions[".css"] = module => { module.exports = {}; };
  const prior = Object.getOwnPropertyDescriptor(globalThis, "React");
  Object.assign(globalThis, { React });
  t.after(() => {
    if (css) require.extensions[".css"] = css; else delete require.extensions[".css"];
    if (prior) Object.defineProperty(globalThis, "React", prior); else Reflect.deleteProperty(globalThis, "React");
  });
  const { CompanySsoScreen } = await import("../../presentation/screen/CompanySsoScreen");
  const locale = { locale: "en" as const, languageTag: "en-US" as const, setLocale() {}, t: () => "" };
  const refresh = () => {};
  let enforced = 0;
  const config = { configured: true, version: 2, idpIssuer: "idp", entryPoint: "https://idp.example.test/", subjectAttribute: "NameID", certificates: [],
    enabled: false, enforced: false, testedAt: null as string | null, metadataUrl: "https://falcon.example.test/metadata", entityId: "https://falcon.example.test/sp", acsUrl: "https://falcon.example.test/acs" };
  const model = { resource: { value: config, loading: false, error: null, refreshing: false, refresh },
    subjects: { loading: true, value: null, error: null, refresh }, command: { pending: false, error: null },
    enforce: async () => { enforced++; }, enable: async () => {}, test: async () => {}, save: async () => {},
  } as unknown as ReturnType<typeof useCompanySso>;
  const view = () => <TmsLocaleContext.Provider value={locale}><CompanySsoScreen model={model} client={{} as AdministrationPort} /></TmsLocaleContext.Provider>;
  let renderer!: ReactTestRenderer;
  await act(async () => { renderer = create(view()); });
  const button = (label: string) => renderer.root.findAllByType("button").find(node => node.children.includes(label))!;
  assert.equal(button("Enable SSO").props.disabled, true);
  assert.equal(button("Require SSO").props.disabled, true);
  config.testedAt = "2026-11-04T00:00:00Z";
  config.enabled = true;
  await act(async () => renderer.update(view()));
  assert.equal(button("Require SSO").props.disabled, true);
  await act(async () => renderer.root.findByProps({ type: "checkbox" }).props.onChange({ target: { checked: true } }));
  assert.equal(button("Require SSO").props.disabled, false);
  config.version = 3;
  await act(async () => renderer.update(view()));
  assert.equal(button("Require SSO").props.disabled, true, "a new configuration requires its own acknowledgement");
  await act(async () => renderer.root.findByProps({ type: "checkbox" }).props.onChange({ target: { checked: true } }));
  await act(async () => button("Require SSO").props.onClick());
  assert.equal(enforced, 1);
  assert.equal(renderer.root.findAllByType("input").some(input => input.props.value === config.entityId), false, "SP values are immutable");
  await act(async () => renderer.unmount());
});
