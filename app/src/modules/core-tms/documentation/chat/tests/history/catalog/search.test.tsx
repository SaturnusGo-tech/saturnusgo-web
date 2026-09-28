import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useChatHistory } from "../../../history/state/useChatHistory";
import type { GuideHistoryApi } from "../../../history/model/api";
import type { GuideChatSummary, GuidePage } from "../../../history/model/history";

Object.assign(globalThis, { React });
const flush = () => new Promise(resolve => setTimeout(resolve, 0));
const chat = (id: string): GuideChatSummary => ({ id, title: id, locale: "en", version: 1, createdAt: "2026-09-28T10:00:00Z",
  updatedAt: "2026-09-28T10:00:00Z", archivedAt: null, pendingTurnId: null });

test("history pages deduplicate, search is bounded, and stale owner results cannot repopulate private history", async () => {
  const requests: { query: string; cursor: string | null; signal?: AbortSignal; resolve(page: GuidePage<GuideChatSummary>): void }[] = [];
  const api = { list: (query: string, cursor: string | null, signal?: AbortSignal) => new Promise<GuidePage<GuideChatSummary>>(resolve => requests.push({ query, cursor, signal, resolve })) } as unknown as GuideHistoryApi;
  let owner = "owner-a", state!: ReturnType<typeof useChatHistory>, tree!: ReactTestRenderer;
  function Hook() { state = useChatHistory(api, owner, 0, true); return null; }
  await act(async () => { tree = create(<Hook />); await flush(); });
  await act(async () => { requests[0].resolve({ items: [chat("A")], nextCursor: "page2" }); await flush(); });
  await act(async () => { state.more(); await flush(); });
  assert.equal(requests[1].cursor, "page2");
  await act(async () => { requests[1].resolve({ items: [chat("A"), chat("B")], nextCursor: null }); await flush(); });
  assert.deepEqual(state.items.map(item => item.id), ["A", "B"]);
  await act(async () => { state.setQuery("x".repeat(140)); });
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 230)); });
  assert.equal(requests[2].query.length, 120); assert.deepEqual(state.items, []);
  await act(async () => { owner = "owner-b"; tree.update(<Hook />); await flush(); });
  assert.equal(requests[2].signal?.aborted, true);
  await act(async () => { requests[2].resolve({ items: [chat("Private A")], nextCursor: null }); await flush(); });
  assert.deepEqual(state.items, []); assert.equal(state.query, ""); act(() => tree.unmount());
});
