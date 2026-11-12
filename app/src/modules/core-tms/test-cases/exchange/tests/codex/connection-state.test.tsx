import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsHttpClientProvider } from "../../../../auth/http/TmsHttpClientContext";
import { TmsSessionProvider } from "../../../../auth/presentation/session/TmsSessionContext";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import { useImportCodexConnection } from "../../state/codex/use-import-codex-connection";
import { grant, setup, windowEvents } from "./fixtures/connection-fixture";
(globalThis as unknown as { React: typeof React }).React = React;

test("late project and account responses are aborted and cannot replace the current grant", async t => {
  windowEvents(t);
  let state!: ReturnType<typeof useImportCodexConnection>; let view!: ReactTestRenderer;
  const requests: { signal: AbortSignal; resolve: (value: unknown) => void }[] = [];
  const http = { getResource: async (path: string) => ({ data: { ...setup,
    workspaceId: new URL(path, "https://fixture.example").searchParams.get("workspaceId") } }),
    get: async (_path: string, signal: AbortSignal) => new Promise(resolve => requests.push({ signal, resolve })) } as unknown as TmsHttpClient;
  function Probe({ projectId, workspaceId }: { projectId: string; workspaceId: string }) { state = useImportCodexConnection(workspaceId, projectId, true); return null; }
  function Root({ projectId, subject, workspaceId = "w" }: { projectId: string; subject: string; workspaceId?: string }) { return <TmsHttpClientProvider client={http}>
    <TmsSessionProvider value={{ kind: "cloud", subject, label: subject, signOut: async () => {} }}><Probe projectId={projectId} workspaceId={workspaceId} /></TmsSessionProvider>
  </TmsHttpClientProvider>; }
  await act(async () => { view = create(<Root projectId="old" subject="first" />); });
  assert.equal(state.status, "checking");
  await act(async () => { view.update(<Root projectId="p" subject="first" />); });
  assert.equal(requests[0]?.signal.aborted, true);
  const current = { ...grant, expiresAt: new Date(Date.now() + 60_000).toISOString() };
  await act(async () => { requests[1]?.resolve({ data: [current], meta: { nextCursor: null } }); });
  assert.equal(state.status, "ready");
  await act(async () => { requests[0]?.resolve({ data: [], meta: { nextCursor: null } }); });
  assert.equal(state.status, "ready");
  await act(async () => { view.update(<Root projectId="p" subject="second" />); });
  assert.equal(requests[1]?.signal.aborted, true); assert.equal(state.status, "checking");
  await act(async () => { requests[2]?.resolve({ data: [], meta: { nextCursor: null } }); });
  assert.equal(state.status, "available");
  await act(async () => { view.update(<Root projectId="p" subject="second" workspaceId="other" />); });
  assert.equal(requests[2]?.signal.aborted, true); assert.equal(state.status, "checking");
  await act(async () => { requests[3]?.resolve({ data: [current], meta: { nextCursor: null } }); });
  assert.equal(state.status, "ready");
  await act(async () => { view.unmount(); });
});

test("unavailable grant reads expose unknown state and focus retries without any mutation", async t => {
  const events = windowEvents(t);
  let state!: ReturnType<typeof useImportCodexConnection>; let view!: ReactTestRenderer; let failed = true; let reads = 0;
  const http = { getResource: async () => ({ data: setup }), get: async () => {
    reads++; if (failed) throw new Error("Private server diagnostic"); return { data: [], meta: { nextCursor: null } };
  } } as unknown as TmsHttpClient;
  function Probe() { state = useImportCodexConnection("w", "p", true); return null; }
  await act(async () => { view = create(<TmsHttpClientProvider client={http}><TmsSessionProvider value={{ kind: "cloud", subject: "person", label: "Person", signOut: async () => {} }}><Probe /></TmsSessionProvider></TmsHttpClientProvider>); });
  assert.equal(state.status, "unknown");
  assert.equal("error" in state, false);
  failed = false;
  await act(async () => { events.dispatchEvent(new Event("focus")); });
  assert.equal(state.status, "available"); assert.equal(reads, 2);
  await act(async () => { view.unmount(); });
});
