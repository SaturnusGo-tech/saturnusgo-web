import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useSettingsSection } from "../state/useSettingsSection";
import { pluginSettingsLink, readPluginSettingsRoute } from "../plugins/plugin-settings-route";
import { navigateWorkspace } from "../../../../state/navigation/browser/workspace-history";
import { useWorkspaceHistory } from "../../../../state/navigation/browser/useWorkspaceHistory";
import type { View } from "../../../../state/types/workspace";

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
    await act(async () => { state.select("plugins"); await flush(); });
    const list = location.href;
    assert.equal(state.section, "plugins"); assert.equal(readPluginSettingsRoute(list), null);
    await act(async () => { navigateWorkspace(new URL(pluginSettingsLink(location.href, "codex"), location.href).href); await flush(); });
    const manage = location.href;
    assert.equal(state.section, "plugins"); assert.equal(readPluginSettingsRoute(manage), "codex");
    await act(async () => { location.href = list; browser.dispatchEvent(new Event("popstate")); await flush(); });
    assert.equal(state.section, "plugins"); assert.equal(readPluginSettingsRoute(location.href), null);
    await act(async () => { location.href = manage; browser.dispatchEvent(new Event("popstate")); await flush(); });
    assert.equal(readPluginSettingsRoute(location.href), "codex");
    await act(async () => { state.select("plugins"); await flush(); });
    assert.equal(readPluginSettingsRoute(location.href), null); assert.equal(state.section, "plugins");
  } finally {
    if (tree) act(() => tree.unmount());
    if (descriptor) Object.defineProperty(globalThis, "window", descriptor); else Reflect.deleteProperty(globalThis, "window");
  }
});

test("Test Data history restores the workspace only while a project is selected", async () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
  const href = "https://falcon.example/work/?workspaceId=w&projectId=p&view=config&settings=test-data";
  const location = { href }, storage = new Map<string, string>();
  const history = { state: null as unknown, pushState(state: unknown, _title: string, next: string) {
    history.state = state; location.href = next;
  }, replaceState(state: unknown, _title: string, next: string) { history.state = state; location.href = next; } };
  const browser = Object.assign(new EventTarget(), { location, history, sessionStorage: {
    getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value),
  } });
  Object.defineProperty(globalThis, "window", { configurable: true, value: browser });
  let hasProject = true, state!: ReturnType<typeof useSettingsSection>, tree!: ReactTestRenderer;
  function Hook() { state = useSettingsSection(hasProject); return null; }
  try {
    await act(async () => { tree = create(<Hook />); await flush(); });
    assert.equal(state.section, "test-data");
    await act(async () => { state.select("appearance"); await flush(); });
    assert.equal(state.section, "appearance");
    await act(async () => { location.href = href; browser.dispatchEvent(new Event("popstate")); await flush(); });
    assert.equal(state.section, "test-data");
    await act(async () => { hasProject = false; tree.update(<Hook />); await flush(); });
    assert.equal(state.section, "appearance");
    await act(async () => { browser.dispatchEvent(new Event("popstate")); await flush(); });
    assert.equal(state.section, "appearance");
    await act(async () => { hasProject = true; tree.update(<Hook />); await flush(); });
    assert.equal(state.section, "test-data");
  } finally {
    if (tree) act(() => tree.unmount());
    if (descriptor) Object.defineProperty(globalThis, "window", descriptor); else Reflect.deleteProperty(globalThis, "window");
  }
});

test("selecting Test Data updates the workspace screen immediately without a reload", async () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
  const eventDescriptor = Object.getOwnPropertyDescriptor(globalThis, "PopStateEvent");
  Object.defineProperty(globalThis, "PopStateEvent", { configurable: true, value: class extends Event {
    state: unknown;
    constructor(type: string, init?: PopStateEventInit) { super(type); this.state = init?.state; }
  } });
  const location = { href: "https://falcon.example/work/?workspaceId=w&projectId=p&view=config&settings=general" };
  const storage = new Map<string, string>();
  const history = { state: null as unknown, pushState(state: unknown, _title: string, href: string) {
    history.state = state; location.href = href;
  }, replaceState(state: unknown, _title: string, href: string) { history.state = state; location.href = href; } };
  const browser = Object.assign(new EventTarget(), { location, history, sessionStorage: {
    getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value),
  } });
  Object.defineProperty(globalThis, "window", { configurable: true, value: browser });
  let state!: ReturnType<typeof useSettingsSection>, tree!: ReactTestRenderer, view!: View, reloads = 0;
  function Hook() {
    const [current, setView] = React.useState<View>("config"); view = current;
    state = useSettingsSection(true);
    useWorkspaceHistory({ workspaceId: "w", projectId: "p", view: current, caseId: "", runId: null, ready: true,
      setView, setCase() {}, setRun() {}, setItem() {}, closeDialog() {}, reload() { reloads += 1; } });
    return null;
  }
  try {
    await act(async () => { tree = create(<Hook />); await flush(); });
    await act(async () => { await state.select("test-data"); await flush(); });
    assert.equal(new URL(location.href).searchParams.get("view"), "test-data");
    assert.equal(view, "test-data");
    assert.equal(reloads, 0);
  } finally {
    if (tree) act(() => tree.unmount());
    if (descriptor) Object.defineProperty(globalThis, "window", descriptor); else Reflect.deleteProperty(globalThis, "window");
    if (eventDescriptor) Object.defineProperty(globalThis, "PopStateEvent", eventDescriptor); else Reflect.deleteProperty(globalThis, "PopStateEvent");
  }
});
