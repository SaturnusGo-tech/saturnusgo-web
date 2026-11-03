import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import { TmsApiError } from "../../../../../../core/tms/transport/http";
import { useCaseMaintenance } from "../../application/useCaseMaintenance";
const source = { runId: "run", runItemId: "item", attemptNo: 2, revision: 4 };
const current = { status: "current", rowVersion: 0, updatedBy: null, updatedAt: null, note: null, source: null, etag: '"test-case-maintenance:a:v0"' } as const;
let value: ReturnType<typeof useCaseMaintenance>;
function Probe({ http, caseId = "a", onConfirmed = () => {} }: { http: TmsHttpClient; caseId?: string; onConfirmed?: (id: string, projection: unknown) => void }) {
  value = useCaseMaintenance(http, caseId, true, onConfirmed); return null;
}
test("mark is optimistic, duplicate submission is blocked, failure rolls back and retry keeps idempotency", async () => {
  const writes: { reject: (e: unknown) => void; resolve: (v: unknown) => void; options: { idempotencyKey: string } }[] = [];
  const http = { getResource: async () => ({ data: current, etag: current.etag }), mutateResource: (_p: string, _m: string, _b: unknown, options: { idempotencyKey: string }) => new Promise((resolve, reject) => writes.push({ resolve, reject, options })) } as unknown as TmsHttpClient;
  let view!: ReactTestRenderer; await act(async () => { view = create(<Probe http={http} />); });
  assert.equal(value.projection?.status, "current");
  await act(async () => { void value.change({ status: "needs_update", source }); void value.change({ status: "current" }); });
  assert.equal(writes.length, 1); assert.equal(value.pending, true); assert.equal(value.projection?.status, "needs_update");
  await act(async () => writes[0].reject(new Error("network")));
  assert.equal(value.projection?.status, "current"); assert.equal(value.error, "write");
  await act(async () => { void value.change({ status: "needs_update", source }); });
  assert.equal(writes[1].options.idempotencyKey, writes[0].options.idempotencyKey);
  await act(async () => writes[1].resolve({ data: { ...current, status: "needs_update", source, rowVersion: 1 }, etag: '"test-case-maintenance:a:v1"' }));
  assert.equal(value.pending, false); assert.equal(value.projection?.status, "needs_update");
  await act(async () => view.unmount());
});
test("rapid case changes cancel reads/writes and late responses cannot update a new case or its callback", async () => {
  const reads: { signal: AbortSignal; resolve: (v: unknown) => void }[] = []; const confirmed: unknown[] = [];
  const http = { getResource: (_p: string, signal: AbortSignal) => new Promise(resolve => reads.push({ signal, resolve })) } as unknown as TmsHttpClient;
  let view!: ReactTestRenderer; const onConfirmed = (...args: unknown[]) => confirmed.push(args);
  await act(async () => { view = create(<Probe http={http} onConfirmed={onConfirmed} />); });
  await act(async () => view.update(<Probe http={http} caseId="b" onConfirmed={onConfirmed} />));
  assert.equal(reads[0].signal.aborted, true); assert.equal(value.projection, null);
  await act(async () => reads[0].resolve({ data: { ...current, status: "needs_update", source }, etag: current.etag }));
  assert.equal(value.projection, null); assert.equal(confirmed.length, 0);
  await act(async () => reads[1].resolve({ data: current, etag: '"test-case-maintenance:b:v0"' }));
  assert.equal((value.projection as import("../../model/case-maintenance").CaseMaintenance | null)?.status, "current"); assert.equal(confirmed.length, 1);
  await act(async () => view.unmount());
});
test("precondition conflict restores confirmed data and requires a fresh independent read before retry", async () => {
  let reads = 0; const confirmed: unknown[] = [];
  const latest = { ...current, status: "needs_update", source, rowVersion: 3, etag: '"test-case-maintenance:a:v3"' } as const;
  const http = { getResource: async () => { reads++; return { data: reads === 1 ? current : latest, etag: reads === 1 ? current.etag : latest.etag }; },
    mutateResource: async () => { throw new TmsApiError("Conflict", 412, null); } } as unknown as TmsHttpClient;
  let view!: ReactTestRenderer; await act(async () => { view = create(<Probe http={http} onConfirmed={(...args) => confirmed.push(args)} />); });
  await act(async () => { await value.change({ status: "needs_update", source }); });
  assert.equal(value.error, "conflict"); assert.equal(reads, 2); assert.equal(value.projection?.rowVersion, 3);
  await act(async () => view.unmount());
});
test("a late mark response after navigation is aborted and never paints or publishes onto the next case", async () => {
  let finish!: (value: unknown) => void, signal!: AbortSignal; const published: string[] = [];
  const http = { getResource: async () => ({ data: current, etag: current.etag }),
    mutateResource: (_p: string, _m: string, _b: unknown, options: { signal: AbortSignal }) => { signal = options.signal; return new Promise(resolve => { finish = resolve; }); } } as unknown as TmsHttpClient;
  const onConfirmed = (id: string) => published.push(id);
  let view!: ReactTestRenderer; await act(async () => { view = create(<Probe http={http} onConfirmed={onConfirmed} />); });
  await act(async () => { void value.change({ status: "needs_update", source }); });
  await act(async () => view.update(<Probe http={http} caseId="b" onConfirmed={onConfirmed} />));
  assert.equal(signal.aborted, true); const before = [...published];
  await act(async () => finish({ data: { ...current, status: "needs_update", source }, etag: "m1" }));
  assert.equal(value.projection?.status, "current"); assert.deepEqual(published, before);
  await act(async () => view.unmount());
});
test("permission loss rolls back the pending mark and clears provenance and write preconditions", async () => {
  const http = { getResource: async () => ({ data: current, etag: current.etag }),
    mutateResource: async () => { throw new TmsApiError("Denied", 403, null); } } as unknown as TmsHttpClient;
  let view!: ReactTestRenderer; await act(async () => { view = create(<Probe http={http} />); });
  await act(async () => { await value.change({ status: "needs_update", source }); });
  assert.equal(value.error, "denied"); assert.equal(value.projection, null); assert.equal(value.etag, null);
  await act(async () => view.unmount());
});
test("newer case projections update a mounted hook and a delayed maintenance GET cannot downgrade them", async () => {
  let finish!: (value: unknown) => void;
  const http = { getResource: () => new Promise(resolve => { finish = resolve; }) } as unknown as TmsHttpClient;
  function Projection({ initial }: { initial: typeof current | import("../../model/case-maintenance").CaseMaintenance }) {
    value = useCaseMaintenance(http, "a", true, () => {}, initial); return null;
  }
  let view!: ReactTestRenderer; await act(async () => { view = create(<Projection initial={current} />); });
  const marked = { ...current, status: "needs_update", source, rowVersion: 1, etag: "m1" } as const;
  await act(async () => view.update(<Projection initial={marked} />));
  assert.equal(value.projection?.rowVersion, 1);
  await act(async () => finish({ data: current, etag: current.etag }));
  assert.equal(value.projection?.rowVersion, 1); assert.equal(value.etag, "m1");
  await act(async () => view.unmount());
});
test("a late write receipt cannot replace a newer confirmed projection delivered while it was pending", async () => {
  let finish!: (value: unknown) => void;
  const marked = { ...current, status: "needs_update", source, rowVersion: 1, etag: "m1" } as const;
  const http = { getResource: async () => ({ data: marked, etag: marked.etag }),
    mutateResource: () => new Promise(resolve => { finish = resolve; }) } as unknown as TmsHttpClient;
  function Projection({ initial }: { initial: import("../../model/case-maintenance").CaseMaintenance }) { value = useCaseMaintenance(http, "a", true, () => {}, initial); return null; }
  let view!: ReactTestRenderer; await act(async () => { view = create(<Projection initial={marked} />); });
  await act(async () => { void value.change({ status: "current" }); });
  const latest = { ...marked, rowVersion: 3, etag: "m3" };
  await act(async () => view.update(<Projection initial={latest} />));
  assert.equal(value.projection?.rowVersion, 3);
  await act(async () => finish({ data: { ...current, rowVersion: 2, etag: "m2" }, etag: "m2" }));
  assert.equal(value.projection?.rowVersion, 3); assert.equal(value.projection?.status, "needs_update"); assert.equal(value.pending, false);
  await act(async () => view.unmount());
});
