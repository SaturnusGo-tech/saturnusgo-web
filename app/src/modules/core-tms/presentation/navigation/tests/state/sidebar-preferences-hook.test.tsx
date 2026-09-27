import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { renderToString } from "react-dom/server";
import { useSidebarPreferences } from "../../state/useSidebarPreferences";
import { sidebarPreferenceKey } from "../../model/sidebar-preferences";

type State = ReturnType<typeof useSidebarPreferences>;
async function setup(t: TestContext, blocked = false) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
  const memory = new Map<string, string>(); const listeners = new Set<(event: { key: string | null }) => void>();
  const storage = { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value), removeItem: (key: string) => memory.delete(key) };
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    get localStorage() { if (blocked) throw new Error("Storage blocked"); return storage; },
    addEventListener: (_: string, callback: (event: { key: string | null }) => void) => listeners.add(callback),
    removeEventListener: (_: string, callback: (event: { key: string | null }) => void) => listeners.delete(callback),
  } });
  let state!: State; let renderer!: ReactTestRenderer; const renders: State[] = [];
  function Probe({ workspace, subject }: { workspace: string; subject: string | null }) {
    state = useSidebarPreferences(workspace, subject); renders.push(state); return null;
  }
  const update = (workspace = "workspace-a", subject: string | null = "user-a") => act(async () => {
    const element = <Probe workspace={workspace} subject={subject} />;
    if (renderer) renderer.update(element); else renderer = create(element);
  });
  t.after(async () => {
    await act(async () => renderer?.unmount());
    if (descriptor) Object.defineProperty(globalThis, "window", descriptor); else Reflect.deleteProperty(globalThis, "window");
  });
  return { memory, listeners, update, renders, state: () => state };
}

test("first render matches SSR and stored preferences load only after hydration", async (t) => {
  const h = await setup(t); h.memory.set(sidebarPreferenceKey("workspace-a", "user-a"), '{"mode":"contextual","pinned":["hooks"]}');
  await h.update();
  assert.deepEqual(h.renders[0].preferences, { mode: "all", pinned: [] }); assert.equal(h.renders[0].ready, false);
  assert.deepEqual(h.state().preferences, { mode: "contextual", pinned: ["hooks"] }); assert.equal(h.state().ready, true);
  function ServerProbe() { return React.createElement("span", null, useSidebarPreferences("workspace-a", "user-a").preferences.mode); }
  assert.equal(renderToString(React.createElement(ServerProbe)), "<span>all</span>");
});

test("switching workspace or identity never renders or persists the prior scope preferences", async (t) => {
  const h = await setup(t); await h.update();
  await act(async () => { h.state().setMode("contextual"); h.state().togglePinned("hooks"); h.state().togglePinned("api"); });
  const original = h.memory.get(sidebarPreferenceKey("workspace-a", "user-a"));
  const start = h.renders.length; await h.update("workspace-b");
  assert.ok(h.renders.slice(start).every(item => item.preferences.mode === "all" && item.preferences.pinned.length === 0));
  assert.equal(h.memory.get(sidebarPreferenceKey("workspace-b", "user-a")), undefined);
  await h.update("workspace-a", "user-b"); assert.deepEqual(h.state().preferences, { mode: "all", pinned: [] });
  await h.update(); assert.deepEqual(h.state().preferences, { mode: "contextual", pinned: ["api", "hooks"] });
  assert.equal(h.memory.get(sidebarPreferenceKey("workspace-a", "user-a")), original);
});

test("blocked storage still allows local changes, batched toggles and reset", async (t) => {
  const h = await setup(t, true); await h.update();
  await act(async () => { h.state().setMode("contextual"); h.state().togglePinned("imports"); h.state().togglePinned("hooks"); h.state().togglePinned("help"); });
  assert.deepEqual(h.state().preferences, { mode: "contextual", pinned: ["cases", "hooks"] });
  await act(async () => h.state().reset()); assert.deepEqual(h.state().preferences, { mode: "all", pinned: [] });
});

test("storage events sync only the current scope and corrupt data resets safely", async (t) => {
  const h = await setup(t); await h.update(); const key = sidebarPreferenceKey("workspace-a", "user-a");
  h.memory.set(key, '{"mode":"contextual","pinned":["api"]}');
  await act(async () => { for (const listener of h.listeners) listener({ key: "other" }); });
  assert.equal(h.state().preferences.mode, "all");
  await act(async () => { for (const listener of h.listeners) listener({ key }); });
  assert.deepEqual(h.state().preferences, { mode: "contextual", pinned: ["api"] });
  h.memory.set(key, "broken");
  await act(async () => { for (const listener of h.listeners) listener({ key }); });
  assert.deepEqual(h.state().preferences, { mode: "all", pinned: [] });
});
