import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useGuideShare } from "../../sharing/state/useGuideShare";
import type { GuideHistoryApi } from "../../history/model/api";
import type { GuideChatShare } from "../../history/model/history";

Object.assign(globalThis, { React });
const shareId = "973dcc31-92c6-496e-a932-964ac8cb4e14";
const saved: GuideChatShare = { id: shareId, turnId: "turn", locale: "ru", createdAt: "2026-09-28T10:00:00Z", revokedAt: null };
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

test("Copy waits for a persisted snapshot and uses only an opaque share ID; revoke removes its link", async () => {
  const copied: string[] = []; let resolve!: (value: GuideChatShare) => void, writes = 0, revoked = "";
  const navigator = Object.getOwnPropertyDescriptor(globalThis, "navigator"), window = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: { location: { href: "https://tms.example/work/?workspaceId=w&projectId=p&view=help&article=falcon-ai-chat&chat=private" } } });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { clipboard: { writeText: async (text: string) => { copied.push(text); } } } });
  const api = { shares: async () => ({ items: [], nextCursor: null }), share: async () => { writes++; return new Promise<GuideChatShare>(done => { resolve = done; }); },
    revoke: async (_chat: string, id: string) => { revoked = id; } } as unknown as GuideHistoryApi;
  let state!: ReturnType<typeof useGuideShare>, tree!: ReactTestRenderer;
  function Hook() { state = useGuideShare(api, "private-chat", "turn", true); return null; }
  try {
    await act(async () => { tree = create(<Hook />); await flush(); });
    await act(async () => { void state.copy(); await flush(); });
    assert.equal(writes, 1); assert.deepEqual(copied, []);
    await act(async () => { resolve(saved); await flush(); });
    const link = new URL(copied[0]); assert.equal(link.searchParams.get("share"), shareId);
    assert.equal(link.searchParams.has("chat"), false); assert.equal(link.searchParams.has("message"), false);
    assert.equal(state.status, "copied");
    await act(async () => { await state.revoke(); }); assert.equal(revoked, shareId); assert.equal(state.share, null); assert.equal(state.status, "revoked");
  } finally {
    act(() => tree.unmount());
    if (navigator) Object.defineProperty(globalThis, "navigator", navigator); else Reflect.deleteProperty(globalThis, "navigator");
    if (window) Object.defineProperty(globalThis, "window", window); else Reflect.deleteProperty(globalThis, "window");
  }
});

test("reopening a shared answer finds its existing active link without creating another snapshot", async () => {
  let writes = 0, state!: ReturnType<typeof useGuideShare>, tree!: ReactTestRenderer;
  const api = { shares: async () => ({ items: [saved], nextCursor: null }), share: async () => { writes++; return saved; } } as unknown as GuideHistoryApi;
  function Hook() { state = useGuideShare(api, "private-chat", "turn", true); return null; }
  await act(async () => { tree = create(<Hook />); await flush(); });
  assert.equal(state.share?.id, shareId); assert.equal(writes, 0); act(() => tree.unmount());
});
