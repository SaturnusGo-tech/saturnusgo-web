import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsApiError } from "../../../../../../../core/tms/transport/http";
import { useChatManagement } from "../../../history/application/manage/useChatManagement";
import type { GuideHistoryApi } from "../../../history/model/api";
import type { GuideChatSummary } from "../../../history/model/history";

Object.assign(globalThis, { React });
const chat: GuideChatSummary = { id: "chat", title: "Old name", locale: "en", version: 3, createdAt: "2026-09-28T10:00:00Z",
  updatedAt: "2026-09-28T10:00:00Z", archivedAt: null, pendingTurnId: null };
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

test("rename conflict preserves the edit, refreshes version, and retries only after another explicit Save", async () => {
  const calls: { title: string; expectedVersion: number }[] = [], changed: boolean[] = [];
  const api = { rename: async (_id: string, body: { title: string; expectedVersion: number }) => {
    calls.push(body); if (calls.length === 1) throw new TmsApiError("Conflict", 412, "test"); return { ...chat, title: body.title };
  }, chat: async () => ({ ...chat, title: "Other edit", version: 8 }) } as unknown as GuideHistoryApi;
  let state!: ReturnType<typeof useChatManagement>, tree!: ReactTestRenderer;
  function Hook() { state = useChatManagement(api, chat, archived => changed.push(archived)); return null; }
  act(() => { tree = create(<Hook />); }); act(() => { state.setMode("rename"); state.setTitle("  My title  "); });
  await act(async () => { await state.save(); });
  assert.equal(state.error, "manageConflict"); assert.equal(state.title, "  My title  "); assert.equal(calls.length, 1);
  await act(async () => { await state.save(); });
  assert.deepEqual(calls, [{ title: "My title", expectedVersion: 3 }, { title: "My title", expectedVersion: 8 }]);
  assert.deepEqual(changed, [false]); assert.equal(state.mode, ""); act(() => tree.unmount());
});

test("archive requires an explicit confirmation action and emits success only after the server commits", async () => {
  let finish!: (value: GuideChatSummary) => void, writes = 0, state!: ReturnType<typeof useChatManagement>, tree!: ReactTestRenderer;
  const changed: boolean[] = [];
  const api = { archive: async (_id: string, body: { expectedVersion: number }) => {
    writes++; assert.equal(body.expectedVersion, 3); return new Promise<GuideChatSummary>(resolve => { finish = resolve; });
  } } as unknown as GuideHistoryApi;
  function Hook() { state = useChatManagement(api, chat, archived => changed.push(archived)); return null; }
  act(() => { tree = create(<Hook />); }); act(() => state.setMode("archive")); assert.equal(writes, 0);
  await act(async () => { void state.save(true); await flush(); }); assert.equal(writes, 1); assert.deepEqual(changed, []);
  await act(async () => { finish({ ...chat, archivedAt: "2026-09-28T11:00:00Z" }); await flush(); });
  assert.deepEqual(changed, [true]); act(() => tree.unmount());
});

test("a completed mutation from a closed history row cannot switch the new workspace", async () => {
  let finish!: (value: GuideChatSummary) => void, state!: ReturnType<typeof useChatManagement>, tree!: ReactTestRenderer;
  const changed: boolean[] = [];
  const api = { archive: () => new Promise<GuideChatSummary>(resolve => { finish = resolve; }) } as unknown as GuideHistoryApi;
  function Hook() { state = useChatManagement(api, chat, value => changed.push(value)); return null; }
  act(() => { tree = create(<Hook />); }); await act(async () => { void state.save(true); await flush(); });
  act(() => tree.unmount()); await act(async () => { finish(chat); await flush(); }); assert.deepEqual(changed, []);
});
