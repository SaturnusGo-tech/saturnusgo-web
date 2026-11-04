import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test, type TestContext } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsLocaleContext } from "../../../../localization/context/TmsLocaleProvider";
import { TmsSessionProvider } from "../../../presentation/session/TmsSessionContext";
import type { TrialStatus } from "../../domain/sign-in";

const trial: TrialStatus = { kind: "personal", startsAt: "2026-11-04T12:00:00Z", expiresAt: "2026-11-11T12:00:00Z", readOnly: false };
async function harness(t: TestContext, scope: string, locale: "en" | "ru" = "en") {
  const require = createRequire(import.meta.url), previousCss = require.extensions[".css"];
  const previousReact = Object.getOwnPropertyDescriptor(globalThis, "React"), previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const storage = new Map<string, string>();
  const events = new EventTarget();
  require.extensions[".css"] = module => { module.exports = {}; };
  Object.assign(globalThis, { React, window: {
    location: { href: "https://tms.example/testcases/umbrella-home/work/?workspaceId=personal_1&projectId=project_1&caseId=old_case#old" },
    localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) },
    addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events),
  } });
  const { TrialNotice } = await import("../../presentation/trial/TrialNotice");
  let renderer: ReactTestRenderer | null = null;
  const render = async (value = trial, user = scope) => {
    const node = <TmsLocaleContext.Provider value={{ locale, languageTag: locale === "ru" ? "ru-RU" : "en-US", setLocale() {}, t: () => "" }}>
      <TmsSessionProvider value={{ kind: "cloud", label: "QA", subject: user, workspaceId: user, signOut: async () => {} }}><TrialNotice trial={value} /></TmsSessionProvider>
    </TmsLocaleContext.Provider>;
    await act(async () => { if (renderer) renderer.update(node); else renderer = create(node); });
    return renderer!;
  };
  t.after(async () => {
    if (renderer) await act(async () => renderer!.unmount());
    if (previousCss) require.extensions[".css"] = previousCss; else delete require.extensions[".css"];
    if (previousReact) Object.defineProperty(globalThis, "React", previousReact); else Reflect.deleteProperty(globalThis, "React");
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow); else Reflect.deleteProperty(globalThis, "window");
  });
  return { render, storage, events };
}
void test("welcome guide follows project navigation while the welcome remains open", async t => {
  const { render, events } = await harness(t, "welcome-navigation");
  const view = await render();
  window.location.href = "https://tms.example/testcases/umbrella-home/work/?workspaceId=personal_1&projectId=project_2&view=suites";
  await act(async () => { events.dispatchEvent(new Event("falcon:navigation")); });
  assert.equal(view.root.findByType("a").props.href, "/testcases/umbrella-home/work/?workspaceId=personal_1&projectId=project_2&view=help&article=create-test-case");
});
void test("welcome uses server trial dates and links directly to authoring docs in the current workspace", async t => {
  const { render, storage } = await harness(t, "welcome-guide");
  const view = await render();
  assert.equal(view.root.findByType("h2").children[0], "Start with your first check");
  assert.deepEqual(view.root.findAllByType("time").map(time => time.props.dateTime), [trial.startsAt, trial.expiresAt]);
  const guide = view.root.findByType("a");
  assert.equal(guide.props.href, "/testcases/umbrella-home/work/?workspaceId=personal_1&projectId=project_1&view=help&article=create-test-case");
  assert.equal(view.root.findAllByType("li").length, 2);
  assert.doesNotMatch(JSON.stringify(view.toJSON()), /payment|For your team|upgrade/i);
  await act(async () => guide.props.onClick());
  assert.equal(view.toJSON(), null);
  assert.equal(storage.size, 1);
  await render();
  assert.equal(view.toJSON(), null);
});
void test("dismissal survives remount without hiding another user's welcome", async t => {
  const { render } = await harness(t, "welcome-dismiss");
  const view = await render();
  await act(async () => view.root.findByProps({ "aria-label": "Dismiss welcome" }).props.onClick());
  assert.equal(view.toJSON(), null);
  await act(async () => view.unmount());
  const other = await harness(t, "welcome-dismiss");
  const remounted = await other.render();
  assert.equal(remounted.toJSON(), null);
  await other.render(trial, "other-personal-account");
  assert.equal(remounted.root.findAllByType("aside").length, 1);
});
void test("expired personal trial preserves truthful read-only notice without first-use actions", async t => {
  const { render } = await harness(t, "welcome-expired", "ru");
  const view = await render({ ...trial, readOnly: true });
  assert.equal(view.root.findByType("h2").children[0], "Пробный период завершён");
  assert.match(JSON.stringify(view.toJSON()), /просмотра и экспорта/);
  assert.equal(view.root.findAllByType("a").length, 0);
  assert.equal(view.root.findAllByType("img").length, 0);
});
void test("company and undated trials never show a personal welcome or invented eligibility", async t => {
  const { render } = await harness(t, "welcome-company");
  const view = await render({ ...trial, kind: "company" });
  assert.equal(view.toJSON(), null);
  await render({ ...trial, expiresAt: null });
  assert.equal(view.toJSON(), null);
});
