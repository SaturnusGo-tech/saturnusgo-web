import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useNotifications } from "../../application/useNotifications";
import type { NotificationClient, NotificationSettings, BrowserNotificationPort } from "../../domain/notifications";

Object.assign(globalThis, { React });
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

test("notification settings load and preference updates never read or mutate the inbox", async () => {
  const calls: string[] = [], versions: number[] = [];
  const settings = { version: 4, locale: "en", categories: ["runs"], browsers: [], telegram: null } as unknown as NotificationSettings;
  const client = { settings: async () => { calls.push("settings"); return settings; },
    inbox: async () => { throw new Error("Settings must not own the inbox query"); }, read: async () => { throw new Error("Settings must not mark inbox items"); },
    preferences: async (_categories: unknown, locale: string, version: number) => { calls.push(locale); versions.push(version); } } as unknown as NotificationClient;
  const browser = { permission: () => "unsupported", fingerprint: async () => null } as BrowserNotificationPort;
  let state!: ReturnType<typeof useNotifications>, tree!: ReactTestRenderer;
  function Hook() { state = useNotifications(client, "en", browser); return null; }
  await act(async () => { tree = create(<Hook />); await flush(); });
  assert.equal(state.loading, false); assert.equal(state.error, null); assert.deepEqual(calls, ["settings"]);
  await act(async () => { await state.changeCategories(["cases"]); });
  assert.deepEqual(calls, ["settings", "en", "settings"]); assert.deepEqual(versions, [4]);
  assert.equal("items" in state, false); assert.equal("markRead" in state, false); act(() => tree.unmount());
});
