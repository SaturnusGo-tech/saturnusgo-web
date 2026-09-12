import React from "react";
import assert from "node:assert/strict";
import { test } from "node:test";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsHttpClientProvider } from "../../auth/http/TmsHttpClientContext";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { useWritingRequest } from "../state/useWritingRequest";
import type { WritingTarget } from "../model/target";

Object.assign(globalThis, { React });

const target = (text: string): WritingTarget => ({ text, selected: true, apply: () => true, restore() {} });
function harness() {
  const requests: { signal?: AbortSignal; resolve: (value: { markdown: string }) => void; reject: (error: Error) => void }[] = [];
  const http = { mutate: (_p: string, _m: string, _b: unknown, signal?: AbortSignal) => new Promise((resolve, reject) => {
    requests.push({ signal, resolve: resolve as (value: { markdown: string }) => void, reject });
  }) } as TmsHttpClient;
  let state!: ReturnType<typeof useWritingRequest>;
  function Hook({ workspaceId, value }: { workspaceId: string; value: WritingTarget }) { state = useWritingRequest(workspaceId, value, true); return null; }
  const render = (workspaceId: string, value: WritingTarget) => <TmsHttpClientProvider client={http}><Hook workspaceId={workspaceId} value={value} /></TmsHttpClientProvider>;
  let tree!: ReactTestRenderer;
  act(() => { tree = create(render("workspace-a", target("source"))); });
  return { requests, tree, get: () => state, update: (workspaceId: string, value: WritingTarget) => act(() => tree.update(render(workspaceId, value))) };
}

test("cancelled or superseded requests cannot replace a later response", async () => {
  const h = harness();
  act(() => { void h.get().run("improve"); });
  assert.equal(h.get().busy, true);
  act(() => h.get().cancel());
  assert.equal(h.requests[0].signal?.aborted, true);
  assert.equal(h.get().busy, false);
  act(() => { void h.get().run("correct"); });
  await act(async () => h.requests[0].resolve({ markdown: "late old answer" }));
  assert.equal(h.get().result, "");
  assert.equal(h.get().busy, true);
  await act(async () => h.requests[1].resolve({ markdown: "new answer" }));
  assert.equal(h.get().result, "new answer");
  assert.equal(h.get().busy, false);
  act(() => h.tree.unmount());
});

test("new target clears old answers and tenant changes abort outstanding work", async () => {
  const h = harness();
  act(() => { void h.get().run("improve"); });
  await act(async () => h.requests[0].resolve({ markdown: "old answer" }));
  h.update("workspace-a", target("new selection"));
  assert.equal(h.get().result, "");
  act(() => { void h.get().run("correct"); });
  h.update("workspace-b", target("other workspace"));
  assert.equal(h.requests[1].signal?.aborted, true);
  assert.equal(h.get().busy, false);
  await act(async () => h.requests[1].resolve({ markdown: "wrong workspace answer" }));
  assert.equal(h.get().result, "");
  act(() => { void h.get().run("improve"); h.tree.unmount(); });
  assert.equal(h.requests[2].signal?.aborted, true);
});
