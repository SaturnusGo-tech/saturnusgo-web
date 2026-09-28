import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useChatResource } from "../../history/state/useChatResource";
import type { GuideHistoryApi } from "../../history/model/api";
import type { GuideChatSummary, GuideChatTurn, GuidePage } from "../../history/model/history";

Object.assign(globalThis, { React });
const flush = () => new Promise(resolve => setTimeout(resolve, 0));
const chat: GuideChatSummary = { id: "chat", title: "Question", locale: "ru", version: 1, createdAt: "2026-09-28T10:00:00Z",
  updatedAt: "2026-09-28T10:00:00Z", archivedAt: null, pendingTurnId: "turn" };
const pending: GuideChatTurn = { id: "turn", question: "Question", state: "pending", answer: null, errorCode: null,
  createdAt: "2026-09-28T10:00:00Z", completedAt: null };
const completed: GuideChatTurn = { ...pending, state: "completed", answer: { answer: "Committed", citations: [], knowledgeVersion: "v1" } };

test("a delayed pending history page cannot overwrite the completed server turn", async () => {
  let resolve!: (page: GuidePage<GuideChatTurn>) => void;
  const api = { chat: async () => chat, turns: async () => new Promise<GuidePage<GuideChatTurn>>(done => { resolve = done; }) } as unknown as GuideHistoryApi;
  let state!: ReturnType<typeof useChatResource>, tree!: ReactTestRenderer;
  function Hook() { state = useChatResource(api, "owner", { chatId: "chat", turnId: null, shareId: null }, true); return null; }
  await act(async () => { tree = create(<Hook />); await flush(); });
  await act(async () => { state.apply({ ...chat, version: 2, pendingTurnId: null }, completed); await flush(); });
  await act(async () => { resolve({ items: [pending], nextCursor: null }); await flush(); });
  assert.equal(state.chat?.version, 2); assert.equal(state.turns[0].state, "completed"); assert.equal(state.turns[0].answer?.answer, "Committed");
  act(() => tree.unmount());
});

test("old answer permalinks load their target and older pages stay chronological without duplicates", async () => {
  const old = { ...completed, id: "old", createdAt: "2026-09-27T10:00:00Z" };
  const requested: string[] = [], cursors: (string | null)[] = [];
  const api = { chat: async () => ({ ...chat, pendingTurnId: null }), turn: async (_chat: string, id: string) => { requested.push(id); return old; },
    turns: async (_chat: string, cursor: string | null) => { cursors.push(cursor); return cursor ? { items: [old], nextCursor: null } : { items: [completed], nextCursor: "older" }; } } as unknown as GuideHistoryApi;
  let state!: ReturnType<typeof useChatResource>, tree!: ReactTestRenderer;
  function Hook() { state = useChatResource(api, "owner", { chatId: "chat", turnId: "old", shareId: null }, true); return null; }
  await act(async () => { tree = create(<Hook />); await flush(); });
  assert.deepEqual(requested, ["old"]); assert.deepEqual(state.turns.map(turn => turn.id), ["old", "turn"]);
  await act(async () => { state.loadEarlier(); await flush(); });
  assert.deepEqual(cursors, [null, "older"]); assert.deepEqual(state.turns.map(turn => turn.id), ["old", "turn"]); assert.equal(state.cursor, null);
  act(() => tree.unmount());
});
