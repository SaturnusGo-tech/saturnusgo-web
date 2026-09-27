import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsHttpClientProvider } from "../../../auth/http/TmsHttpClientContext";
import { TmsApiError, type TmsHttpClient, type TmsMutationOptions, type TmsResource } from "../../../../../core/tms/transport/http";
import { useFieldValueWrite } from "../../state/values/useFieldValueWrite";
import { useFieldPage } from "../../state/list/useFieldPage";
import type { CustomFieldPage, CustomFieldValue } from "../../model/custom-field";
import { field, scope, value } from "../support/fixtures";
const originalReact = Object.getOwnPropertyDescriptor(globalThis, "React");
before(() => Object.assign(globalThis, { React }));
after(() => { if (originalReact) Object.defineProperty(globalThis, "React", originalReact); else Reflect.deleteProperty(globalThis, "React"); });
test("value writes block duplicate clicks, retain retry identity, and require confirmed similar IDs", async () => {
  const pending: { body: unknown; options: TmsMutationOptions; resolve(value: TmsResource<CustomFieldValue>): void; reject(error: unknown): void }[] = [];
  const http = { mutateResource: (_: string, __: string, body: unknown, options: TmsMutationOptions) =>
    new Promise<TmsResource<CustomFieldValue>>((resolve, reject) => pending.push({ body, options, resolve, reject })) } as unknown as TmsHttpClient;
  let state!: ReturnType<typeof useFieldValueWrite>; let root!: ReactTestRenderer;
  function Probe() { state = useFieldValueWrite(scope, field.id, false); return null; }
  try {
    await act(async () => { root = create(<TmsHttpClientProvider client={http}><Probe /></TmsHttpClientProvider>); });
    await act(async () => { void state.save({ value: "Acme 2" }); void state.save({ value: "Acme 2" }); });
    assert.equal(pending.length, 1); assert.equal(state.pending, true);
    await act(async () => pending[0].reject(new Error("Connection lost")));
    await act(async () => { void state.save({ value: "Acme 2" }); });
    assert.equal(pending[0].options.idempotencyKey, pending[1].options.idempotencyKey);
    await act(async () => pending[1].reject(new TmsApiError("Similar", 409, null, "CONFLICT", null,
      { reason: "SIMILAR_VALUES_EXIST", similarValues: [value] })));
    assert.equal(state.conflict?.kind, "similar"); assert.equal(state.error, "");
    await act(async () => { void state.save({ value: "Acme 2", confirmedSimilarValueIds: [value.id] }); });
    assert.notEqual(pending[2].options.idempotencyKey, pending[1].options.idempotencyKey);
    assert.deepEqual(pending[2].body, { value: "Acme 2", confirmedSimilarValueIds: [value.id] });
    await act(async () => pending[2].resolve({ data: { ...value, value: "Acme 2", label: "Acme 2" }, etag: null }));
    assert.equal(state.pending, false); assert.equal(state.conflict, null);
    await act(async () => { void state.save({ value: "Later" }); });
    await act(async () => root.unmount()); assert.equal(pending[3].options.signal?.aborted, true);
    await act(async () => pending[3].resolve({ data: value, etag: null }));
  } finally { await act(async () => root?.unmount()); }
});
test("paged values cancel stale project searches and append unique values only", async () => {
  type Item = { id: string }; type Load = (query: string, cursor: string | null, signal: AbortSignal) => Promise<CustomFieldPage<Item>>;
  const pending: { cursor: string | null; signal: AbortSignal; resolve(value: CustomFieldPage<Item>): void }[] = [];
  const loader: Load = (_, cursor, signal) => new Promise(resolve => pending.push({ cursor, signal, resolve }));
  const nextLoader: Load = (...args) => loader(...args);
  let state!: ReturnType<typeof useFieldPage<Item>>; let root!: ReactTestRenderer;
  function Probe({ load }: { load: Load }) { state = useFieldPage(load); return null; }
  const tick = () => act(async () => { await new Promise(resolve => setTimeout(resolve, 5)); });
  try {
    await act(async () => { root = create(<Probe load={loader} />); }); await tick();
    await act(async () => root.update(<Probe load={nextLoader} />)); await tick();
    assert.equal(pending[0].signal.aborted, true);
    await act(async () => pending[0].resolve({ items: [{ id: "old-project" }], nextCursor: null }));
    assert.deepEqual(state.items, []);
    await act(async () => pending[1].resolve({ items: [{ id: "a" }], nextCursor: "page-2" }));
    await act(async () => { void state.more(); void state.more(); }); assert.equal(pending.length, 3);
    await act(async () => pending[2].resolve({ items: [{ id: "a" }, { id: "b" }], nextCursor: null }));
    assert.deepEqual(state.items, [{ id: "a" }, { id: "b" }]); assert.equal(state.cursor, null);
  } finally { await act(async () => root?.unmount()); }
});
