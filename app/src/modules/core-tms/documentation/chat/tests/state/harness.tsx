import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import type { GuideAnswer } from "../../model/conversation";
import { useGuideConversation } from "../../state/useGuideConversation";

Object.assign(globalThis, { React });
export function chatHarness() {
  const requests: { path: string; body: { locale: string; messages: { role: string; content: string }[] }; signal?: AbortSignal;
    resolve: (value: GuideAnswer) => void; reject: (error: Error) => void }[] = [];
  const http = { mutate: (path: string, _method: string, body: unknown, signal?: AbortSignal) => new Promise((resolve, reject) => {
    requests.push({ path, body: body as typeof requests[number]["body"], signal, resolve: resolve as (value: GuideAnswer) => void, reject });
  }) } as TmsHttpClient;
  type Scope = Parameters<typeof useGuideConversation>[0];
  let scope: Scope = { http, workspaceId: "workspace-a", subject: "member-a", locale: "ru", enabled: true };
  let state!: ReturnType<typeof useGuideConversation>, tree!: ReactTestRenderer;
  function Hook() { state = useGuideConversation(scope); return null; }
  act(() => { tree = create(<Hook />); });
  return { requests, get: () => state, update: (patch: Partial<Scope>) => act(() => { scope = { ...scope, ...patch }; tree.update(<Hook />); }),
    draft: (text: string) => act(() => state.setDraft(text)), send: () => act(() => { void state.send(); }),
    reply: (index: number, answer = "Answer") => act(async () => requests[index].resolve({ answer, citations: [], knowledgeVersion: "fixture" })),
    fail: (index: number, error: Error) => act(async () => requests[index].reject(error)),
    unmount: () => act(() => tree.unmount()) };
}
