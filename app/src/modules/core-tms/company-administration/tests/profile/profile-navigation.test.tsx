import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useProfileScreen } from "../../presentation/profile-page/useProfileScreen";

test("profile sessions and password pages preserve workspace context and browser history", async () => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalPop = Object.getOwnPropertyDescriptor(globalThis, "PopStateEvent");
  const events = new EventTarget(), storage = new Map<string, string>();
  let location = new URL("https://tenant.test/work/?workspaceId=w&projectId=p&view=profile");
  let historyState: Record<string, unknown> = {}, index = 0;
  const entries = [{ href: location.href, state: historyState }];
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    get location() { return location; },
    sessionStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) },
    history: { get state() { return historyState; },
      replaceState(state: Record<string, unknown>, _: string, href: string) { historyState = state; location = new URL(href, location); entries[index] = { href: location.href, state }; },
      pushState(state: Record<string, unknown>, _: string, href: string) { historyState = state; location = new URL(href, location); entries.splice(++index, entries.length, { href: location.href, state }); },
    },
    addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events), dispatchEvent: events.dispatchEvent.bind(events),
  }});
  Object.defineProperty(globalThis, "PopStateEvent", { configurable: true, value: class extends Event {} });
  let current!: ReturnType<typeof useProfileScreen>, renderer!: ReactTestRenderer;
  function Probe() { current = useProfileScreen(); return null; }
  const move = (direction: number) => { const entry = entries[index += direction]; location = new URL(entry.href); historyState = entry.state; events.dispatchEvent(new Event("popstate")); };
  try {
    await act(async () => { renderer = create(<Probe />); });
    assert.equal(current.screen, "profile");
    await act(async () => current.navigate("sessions"));
    assert.equal(current.screen, "sessions"); assert.equal(location.hash, "#sessions");
    assert.equal(location.search, "?workspaceId=w&projectId=p&view=profile");
    await act(async () => current.navigate("profile")); assert.equal(current.screen, "profile");
    await act(async () => move(-1)); assert.equal(current.screen, "sessions");
    await act(async () => move(-1)); assert.equal(current.screen, "profile");
    await act(async () => move(1)); assert.equal(current.screen, "sessions");
    await act(async () => { location.hash = "security"; events.dispatchEvent(new Event("hashchange")); });
    assert.equal(current.screen, "security");
    await act(async () => current.navigate("profile")); assert.equal(location.hash, "");
    await act(async () => current.navigate("security")); assert.equal(current.screen, "security");
  } finally {
    await act(async () => renderer?.unmount());
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow); else Reflect.deleteProperty(globalThis, "window");
    if (originalPop) Object.defineProperty(globalThis, "PopStateEvent", originalPop); else Reflect.deleteProperty(globalThis, "PopStateEvent");
  }
});
