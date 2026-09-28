import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useSettingsSection } from "../state/useSettingsSection";

Object.assign(globalThis, { React });
const flush = () => new Promise(resolve => setTimeout(resolve, 0));
test("settings tabs restore on back/forward and the notifications legacy URL is replaced once", async () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
  const location = { href: "https://falcon.example/work/?workspaceId=w&view=notifications" };
  const writes: { method: string; href: string }[] = [], storage = new Map<string, string>();
  const history = { state: null as unknown, pushState(state: unknown, _title: string, href: string) {
    history.state = state; location.href = href; writes.push({ method: "push", href });
  }, replaceState(state: unknown, _title: string, href: string) { history.state = state; location.href = href; writes.push({ method: "replace", href }); } };
  const browser = Object.assign(new EventTarget(), { location, history, sessionStorage: { getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value) } });
  Object.defineProperty(globalThis, "window", { configurable: true, value: browser });
  let state!: ReturnType<typeof useSettingsSection>, tree!: ReactTestRenderer;
  function Hook() { state = useSettingsSection(false); return null; }
  try {
    await act(async () => { tree = create(<Hook />); await flush(); });
    assert.equal(state.section, "notifications"); assert.equal(new URL(location.href).searchParams.get("view"), "config");
    assert.equal(writes.filter(write => write.method === "replace" && new URL(write.href).searchParams.get("view") === "config").length, 1);
    const previous = location.href;
    await act(async () => { state.select("account"); await flush(); });
    assert.equal(state.section, "account"); const next = location.href;
    await act(async () => { location.href = previous; browser.dispatchEvent(new Event("popstate")); await flush(); });
    assert.equal(state.section, "notifications");
    await act(async () => { location.href = next; browser.dispatchEvent(new Event("popstate")); await flush(); });
    assert.equal(state.section, "account");
  } finally {
    if (tree) act(() => tree.unmount());
    if (descriptor) Object.defineProperty(globalThis, "window", descriptor); else Reflect.deleteProperty(globalThis, "window");
  }
});
