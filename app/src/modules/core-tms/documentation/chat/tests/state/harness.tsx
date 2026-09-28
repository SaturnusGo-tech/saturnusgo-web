import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useGuideConversation } from "../../state/useGuideConversation";
import { guideBackend } from "../history/support/backend";

Object.assign(globalThis, { React });
export const flush = () => new Promise(resolve => setTimeout(resolve, 0));
export function chatHarness(backend = guideBackend()) {
  type Scope = Parameters<typeof useGuideConversation>[0];
  let scope: Scope = { http: backend.api, workspaceId: "workspace-a", subject: "member-a", locale: "ru", enabled: true };
  let state!: ReturnType<typeof useGuideConversation>, tree!: ReactTestRenderer;
  function Hook() { state = useGuideConversation(scope); return null; }
  act(() => { tree = create(<Hook />); });
  return { backend, requests: backend.requests, get: () => state,
    update: async (patch: Partial<Scope>) => act(async () => { scope = { ...scope, ...patch }; tree.update(<Hook />); await flush(); }),
    draft: (text: string) => act(() => state.setDraft(text)),
    send: () => act(async () => { void state.send(); await flush(); }),
    reply: (index: number, answer = "Answer") => act(async () => { backend.complete(index, answer); await flush(); }),
    fail: (index: number, code = "AI_GUIDE_UNAVAILABLE") => act(async () => { backend.fail(index, code); await flush(); }),
    run: (action: () => void | Promise<void>) => act(async () => { await action(); await flush(); }),
    unmount: () => act(() => tree.unmount()) };
}
