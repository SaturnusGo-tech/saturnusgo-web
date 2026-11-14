import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create } from "react-test-renderer";
import { useDataCatalog } from "../../application/catalog/useDataCatalog";
import { useDataCommand } from "../../application/command/useDataCommand";
test("changing a resource search cancels earlier requests and ignores a late result", async () => {
  const requests: Array<{ search: string; signal: AbortSignal; resolve(value: { items: { id: string }[]; cursor: null }): void }> = [];
  const loader = (search: string, _cursor: string | null, signal: AbortSignal) => new Promise<{ items: { id: string }[]; cursor: null }>(resolve => requests.push({ search, signal, resolve }));
  let activeLoader = loader;
  const renders: Array<{ source: typeof loader; ids: readonly string[] }> = [];
  let catalog!: ReturnType<typeof useDataCatalog<{ id: string }>>;
  function Harness() { catalog = useDataCatalog(activeLoader); renders.push({ source: activeLoader, ids: catalog.items.map(item => item.id) }); return null; }
  let view: ReturnType<typeof create>;
  await act(async () => { view = create(<Harness />); await new Promise(resolve => setTimeout(resolve, 5)); });
  await act(async () => { catalog.setSearch("new"); });
  assert.equal(requests[0].signal.aborted, true);
  await act(async () => { requests[0].resolve({ items: [{ id: "old" }], cursor: null }); await new Promise(resolve => setTimeout(resolve, 200)); });
  await act(async () => { requests[1].resolve({ items: [{ id: "new" }], cursor: null }); });
  assert.deepEqual(catalog.items, [{ id: "new" }]);
  activeLoader = () => new Promise(() => {});
  await act(async () => { view.update(<Harness />); });
  assert.ok(renders.filter(render => render.source === activeLoader).every(render => render.ids.length === 0), "a new catalog cannot render items from the previous scope, even before effects");
  await act(async () => view.unmount());
});
test("lost mutation responses retry with the same idempotency key; a changed intent receives a new key", async () => {
  let command!: ReturnType<typeof useDataCommand>;
  function Harness() { command = useDataCommand(); return null; }
  const view = create(<Harness />), keys: string[] = [];
  const fail = async (_signal: AbortSignal, key: string) => { keys.push(key); throw { code: "NETWORK_ERROR" }; };
  await act(async () => { await command.execute(fail, "v1"); });
  await act(async () => { await command.execute(fail, "v1"); });
  assert.equal(keys[0], keys[1]);
  await act(async () => { await command.execute(fail, "v2"); });
  assert.notEqual(keys[1], keys[2]);
  await act(async () => view.unmount());
});
