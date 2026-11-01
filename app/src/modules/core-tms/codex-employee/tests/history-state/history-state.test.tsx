import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useExecutionHistory } from "../../execution-history/application/useExecutionHistory";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
let current: ReturnType<typeof useExecutionHistory>;
const scope = { workspaceId: "w", projectId: "p", runId: "r", itemId: "i" };
function Probe({ http, itemId }: {
    http: TmsHttpClient;
    itemId: string;
}) { current = useExecutionHistory(http, { ...scope, itemId }, true); return null; }
test("history pagination never presents first page as complete and navigation ignores stale responses", async () => {
    const pending: {
        signal: AbortSignal;
        resolve: (value: unknown) => void;
    }[] = [];
    const http = { get: (_path: string, signal: AbortSignal) => new Promise(resolve => pending.push({ signal, resolve })) } as unknown as TmsHttpClient;
    let view!: ReactTestRenderer;
    await act(async () => { view = create(<Probe http={http} itemId="i"/>); });
    assert.equal(current.loading, true);
    const event = { id: "old", ...scope, attemptNo: 1, kind: "result_recorded", status: "failed", actor: "Codex", actorIdentityId: "agent", actorKind: "agent", actorProvider: "codex", createdAt: "2026-11-01T00:00:00Z" };
    await act(async () => pending[0].resolve({ data: [event], meta: { hasMore: true, nextCursor: "next", limit: 30 } }));
    assert.equal(current.items.length, 1);
    assert.equal(current.nextCursor, "next");
    await act(async () => { void current.more(); });
    await act(async () => { view.update(<Probe http={http} itemId="new"/>); });
    assert.equal(pending[1].signal.aborted, true);
    assert.deepEqual(current.items, []);
    await act(async () => pending[1].resolve({ data: [{ ...event, id: "late" }], meta: { hasMore: false, nextCursor: null, limit: 30 } }));
    assert.deepEqual(current.items, []);
    await act(async () => pending[2].resolve({ data: [], meta: { hasMore: false, nextCursor: null, limit: 30 } }));
    assert.equal(current.loading, false);
    assert.deepEqual(current.items, []);
    await act(async () => view.unmount());
});

test("permission loss during pagination clears previously readable authorship",async()=>{
  const {TmsApiError}=await import("../../../../../core/tms/transport/http");
  let reads=0;
  const http={get:async()=>{
    if(reads++)throw new TmsApiError("Denied",403,null,"FORBIDDEN");
    return {data:[{id:"e",...scope,attemptNo:1,kind:"result_recorded",status:"passed",actor:"Codex",actorIdentityId:"agent",createdAt:"2026-11-01T00:00:00Z"}],meta:{hasMore:true,nextCursor:"next",limit:30}};
  }} as unknown as TmsHttpClient;
  let view!:ReactTestRenderer;
  await act(async()=>{view=create(<Probe http={http} itemId="i"/>);});
  assert.equal(current.items.length,1);
  await act(async()=>{await current.more();});
  assert.deepEqual(current.items,[]);assert.equal(current.nextCursor,null);assert.equal(current.error,true);
  await act(async()=>view.unmount());
});
