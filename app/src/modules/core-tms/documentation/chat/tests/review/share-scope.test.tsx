import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useGuideShare } from "../../sharing/state/useGuideShare";
import type { GuideHistoryApi } from "../../history/model/api";
import type { GuideChatShare } from "../../history/model/history";

Object.assign(globalThis, { React });
const saved: GuideChatShare = { id: "973dcc31-92c6-496e-a932-964ac8cb4e14", turnId: "turn", locale: "ru",
  createdAt: "2026-09-28T10:00:00Z", revokedAt: null };
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

test("share request cannot write a stale workspace link to clipboard after its component unmounts", async () => {
  const navigator = Object.getOwnPropertyDescriptor(globalThis, "navigator"), window = Object.getOwnPropertyDescriptor(globalThis, "window");
  const location = { href: "https://tms.example/work/?workspaceId=a&projectId=p&view=help&article=falcon-ai-chat" };
  const copied: string[] = [];
  Object.defineProperty(globalThis, "window", { configurable: true, value: { location } });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { clipboard: { writeText: async (text: string) => { copied.push(text); } } } });
  let complete: ((value: GuideChatShare) => void) | undefined, state: ReturnType<typeof useGuideShare> | undefined;
  let tree: ReactTestRenderer | undefined;
  const api = { shares: async () => ({ items: [], nextCursor: null }),
    share: async () => new Promise<GuideChatShare>(resolve => { complete = resolve; }) } as unknown as GuideHistoryApi;
  function Hook() { state = useGuideShare(api, "chat-a", "turn", true); return null; }
  try {
    await act(async () => { tree = create(<Hook />); await flush(); });
    await act(async () => { void state?.copy(); await flush(); });
    assert.ok(complete);
    act(() => tree?.unmount()); tree = undefined;
    location.href = "https://tms.example/work/?workspaceId=b&projectId=other&view=help&article=falcon-ai-chat";
    await act(async () => { complete?.(saved); await flush(); });
    assert.deepEqual(copied, []);
  } finally {
    if (tree) act(() => tree?.unmount());
    if (navigator) Object.defineProperty(globalThis, "navigator", navigator); else Reflect.deleteProperty(globalThis, "navigator");
    if (window) Object.defineProperty(globalThis, "window", window); else Reflect.deleteProperty(globalThis, "window");
  }
});
