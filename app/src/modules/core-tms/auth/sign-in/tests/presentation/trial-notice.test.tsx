import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsLocaleContext } from "../../../../localization/context/TmsLocaleProvider";

void test("personal trial shows the server deadline and its team action never navigates to payment", async t => {
  const require = createRequire(import.meta.url);
  const previous = require.extensions[".css"];
  require.extensions[".css"] = module => { module.exports = {}; };
  const previousReact = Object.getOwnPropertyDescriptor(globalThis, "React");
  Object.assign(globalThis, { React });
  t.after(() => {
    if (previous) require.extensions[".css"] = previous; else delete require.extensions[".css"];
    if (previousReact) Object.defineProperty(globalThis, "React", previousReact); else Reflect.deleteProperty(globalThis, "React");
  });
  const { TrialNotice } = await import("../../presentation/trial/TrialNotice");
  const locale = { locale: "en" as const, languageTag: "en-US" as const, setLocale: () => {}, t: () => "" };
  let renderer!: ReactTestRenderer;
  await act(async () => { renderer = create(<TmsLocaleContext.Provider value={locale}><TrialNotice trial={{
    kind: "personal", startsAt: "2026-11-04T00:00:00Z", expiresAt: "2026-11-11T00:00:00Z", readOnly: false,
  }} /></TmsLocaleContext.Provider>); });
  assert.match(JSON.stringify(renderer.toJSON()), /November 11, 2026/);
  assert.equal(renderer.root.findAllByType("a").length, 0);
  const team = renderer.root.findAllByType("button").find(button => button.children.includes("For your team"));
  assert.ok(team);
  await act(async () => team.props.onClick());
  assert.equal(renderer.root.findByProps({ role: "status" }).children[0], "Payments are not available yet");
  await act(async () => renderer.root.findByProps({ "aria-label": "Dismiss notification" }).props.onClick());
  assert.equal(renderer.toJSON(), null);
  await act(async () => renderer.unmount());
});
