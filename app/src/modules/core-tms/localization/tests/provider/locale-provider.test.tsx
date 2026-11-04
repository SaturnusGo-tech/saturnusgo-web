import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsLocaleProvider, type TmsLocaleContextValue } from "../../context/TmsLocaleProvider";
import { useTmsLocale } from "../../context/useTmsLocale";
import type { TmsLocale } from "../../model/locale";

async function mount(t: TestContext, options: { search: string; saved?: string; browser?: string; blocked?: boolean; initial?: TmsLocale }) {
  const previous = ["React", "window", "document"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  const values = new Map(options.saved ? [["tms.locale.v1", options.saved]] : []);
  const root = { lang: "ru", hasAttribute: () => true, getAttribute: () => root.lang, removeAttribute() { root.lang = ""; } };
  const historyState = { continuation: "retained" };
  const browser = { location: new URL(`/cloud-login/${options.search}`, "https://tms.example.test"),
    navigator: { language: options.browser ?? "ru-RU" },
    localStorage: { getItem(key: string) { if (options.blocked) throw new Error("blocked"); return values.get(key) ?? null; },
      setItem(key: string, value: string) { if (options.blocked) throw new Error("blocked"); values.set(key, value); } },
    history: { state: historyState, replaceState(state: unknown, _title: string, path: string) {
      assert.equal(state, historyState); browser.location = new URL(path, browser.location);
    } } };
  Object.assign(globalThis, { React, window: browser, document: { documentElement: root } });
  let current!: TmsLocaleContextValue;
  function Probe() { current = useTmsLocale(); return <p lang={current.locale}>{current.locale}</p>; }
  let renderer!: ReactTestRenderer;
  const render = () => <TmsLocaleProvider initialLocale={options.initial}><Probe /></TmsLocaleProvider>;
  t.after(async () => {
    await act(async () => renderer.unmount());
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key);
    }
  });
  await act(async () => { renderer = create(render()); });
  return { values, root, browser, locale: () => current.locale, switchTo: async (locale: TmsLocale) => {
    await act(async () => current.setLocale(locale));
  }, reload: async () => {
    await act(async () => renderer.unmount());
    await act(async () => { renderer = create(render()); });
  } };
}

void test("an explicit English handoff overrides a saved Russian preference and Russian browser", async t => {
  const view = await mount(t, { search: "?lang=en", saved: "ru" });
  assert.equal(view.locale(), "en"); assert.equal(view.root.lang, "en");
  assert.equal(view.values.get("tms.locale.v1"), "en");
});
void test("an explicit Russian handoff overrides a saved English preference", async t => {
  const view = await mount(t, { search: "?lang=ru", saved: "en", browser: "en-US" });
  assert.equal(view.locale(), "ru"); assert.equal(view.values.get("tms.locale.v1"), "ru");
});
void test("invalid or duplicate handoff values preserve the saved preference", async t => {
  for (const search of ["?lang=es", "?lang=", "?lang=en&lang=ru", "?lang=en&lang=en", ""]) {
    await t.test(search || "no query", async child => {
      const view = await mount(child, { search, saved: "ru", browser: "en-US" });
      assert.equal(view.locale(), "ru");
    });
  }
});
void test("a handoff still selects English when browser storage is blocked", async t => {
  const view = await mount(t, { search: "?lang=en", blocked: true });
  assert.equal(view.locale(), "en"); assert.equal(view.root.lang, "en");
});
void test("an explicit provider locale remains authoritative over query and saved preferences", async t => {
  const view = await mount(t, { search: "?lang=en", saved: "en", initial: "ru" });
  assert.equal(view.locale(), "ru");
});
void test("switching language updates the entry query without losing auth context and survives reload", async t => {
  const view = await mount(t, { search: "?lang=en&desktopAttempt=opaque&guide=chat#details", blocked: true });
  await view.switchTo("ru");
  assert.equal(view.browser.location.search, "?lang=ru&desktopAttempt=opaque&guide=chat");
  assert.equal(view.browser.location.hash, "#details");
  await view.reload(); assert.equal(view.locale(), "ru");
});
