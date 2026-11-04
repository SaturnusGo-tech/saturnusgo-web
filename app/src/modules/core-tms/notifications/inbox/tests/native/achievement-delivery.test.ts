import assert from "node:assert/strict";
import { test } from "node:test";
import { createAchievementDelivery } from "../../native/achievement-delivery";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useInboxRefresh } from "../../application/useInboxRefresh";
import { useNotificationInbox } from "../../application/useNotificationInbox";
import type { NotificationInboxClient } from "../../../domain/inbox";

const started = Date.parse("2026-11-05T12:00:00Z");
const item = (id: string, action = "profile.achievement.earned", read = false, date = started + 1000) => ({ id, action, read, createdAt: new Date(date).toISOString() });
test("first inbox load is a silent baseline, including historical earned achievements", () => {
  const delivery = createAchievementDelivery(started);
  assert.deepEqual(delivery.consume([item("old")]), []);
  assert.deepEqual(delivery.consume([item("old"), item("new")]), ["new"]);
});
test("refresh, locale refresh and read changes cannot repeat a delivered award", () => {
  const delivery = createAchievementDelivery(started);
  delivery.consume([]);
  assert.deepEqual(delivery.consume([item("one")]), ["one"]);
  assert.deepEqual(delivery.consume([item("one"), item("two", "run.created")]), []);
  assert.deepEqual(delivery.consume([item("one", undefined, true)]), []);
});
test("pagination and delayed historical records never produce native notifications", () => {
  const delivery = createAchievementDelivery(started);
  delivery.consume([]);
  assert.deepEqual(delivery.consume([item("history", undefined, false, started - 1), item("read", undefined, true),
    { ...item("invalid"), createdAt: "invalid" }]), []);
});
test("persisted IDs suppress repeat awards and large batches remain bounded", () => {
  const delivery = createAchievementDelivery(started, ["saved"]);
  delivery.consume([]);
  const items = [item("saved"), ...Array.from({ length: 20 }, (_, index) => item(`award-${index}`))];
  assert.equal(delivery.consume(items).length, 3);
  assert.deepEqual(delivery.consume(items), []);
  assert.ok(delivery.seen().includes("saved"));
});

test("minimized desktop keeps a bounded inbox poll while hidden web pauses and disconnect cleans up", async t => {
  const originals = ["window", "document", "navigator"].map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)] as const);
  t.after(() => originals.forEach(([name, descriptor]) => descriptor
    ? Object.defineProperty(globalThis, name, descriptor) : Reflect.deleteProperty(globalThis, name)));
  for (const desktop of [true, false]) {
    const win = new EventTarget(), doc = Object.assign(new EventTarget(), { visibilityState: "hidden" });
    let tick: (() => void) | undefined, calls = 0, cleared = 0, dismisses = 0;
    Object.defineProperty(globalThis, "window", { configurable: true, value: Object.assign(win, {
      setInterval: (callback: () => void, delay: number) => { assert.equal(delay, 30000); tick = callback; return 1; },
      clearInterval: () => { cleared++; tick = undefined; },
    }) });
    Object.defineProperty(globalThis, "document", { configurable: true, value: doc });
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: { userAgent: desktop ? "Electron/43 FalconDesktop/0.1.8" : "Chrome/140" } });
    const client: NotificationInboxClient = {
      list: async () => { calls++; return { items: [], next: null, unreadCount: 0 }; },
      read: async () => {}, readAll: async () => {}, archiveRead: async () => {},
    };
    function Probe({ connected }: { connected: boolean }) {
      const model = useNotificationInbox(client, connected);
      useInboxRefresh(client, connected, false, model.refresh, () => { dismisses++; });
      return null;
    }
    // React 18 test renderer and the app's React 19 declarations use different ReactNode types.
    const probe = (connected: boolean) => React.createElement(Probe, { connected }) as unknown as Parameters<typeof create>[0];
    let renderer!: ReactTestRenderer;
    await act(async () => { renderer = create(probe(true)); });
    assert.equal(calls, 1);
    await act(async () => tick?.());
    assert.equal(calls, desktop ? 2 : 1, desktop ? "desktop must poll while minimized" : "hidden browser must stay paused");
    doc.visibilityState = "visible";
    await act(async () => { doc.dispatchEvent(new Event("visibilitychange")); });
    assert.equal(calls, desktop ? 3 : 2);
    await act(async () => renderer.update(probe(false)));
    assert.equal(cleared, 1); assert.equal(tick, undefined); assert.equal(dismisses, 1);
    const before = calls;
    await act(async () => { win.dispatchEvent(new Event("focus")); doc.dispatchEvent(new Event("visibilitychange")); });
    assert.equal(calls, before);
    await act(async () => renderer.unmount());
  }
});
