import assert from "node:assert/strict";
import test from "node:test";
import { defect, item, run } from "../fixtures/execution-fixture";
import { contextHarness } from "../support/context-harness";

for (const changed of ["workspace", "project", "defect", "run", "item", "case", "disconnect", "unmount"] as const) {
  test(`${changed} switch aborts the request and prevents late historical context from appearing`, async () => {
    let release!: (response: Response) => void;
    const delayed = new Promise<Response>(resolve => { release = resolve; });
    let itemReads = 0;
    const f = await contextHarness(request => request.path.endsWith("/item-1")
      ? ++itemReads === 1 ? delayed : new Promise<Response>(() => {}) : Response.json({ data: run }));
    const firstRequest = f.requests.find(request => request.path.endsWith("/item-1"));
    assert.equal(f.current.pending, true);
    const switchIndex = f.renders.length;
    if (changed === "workspace") await f.update({ workspaceId: "workspace-2" });
    if (changed === "project") await f.update({ defect: { ...defect, projectId: "project-2" } });
    if (changed === "defect") await f.update({ defect: { ...defect, id: "bug-2" } });
    if (changed === "run") await f.update({ defect: { ...defect, runId: "run-2" } });
    if (changed === "item") await f.update({ defect: { ...defect, runItemId: "item-2" } });
    if (changed === "case") await f.update({ defect: { ...defect, sourceCaseId: "case-2" } });
    if (changed === "disconnect") await f.update({ connected: false });
    if (changed === "unmount") await f.dispose();
    assert.equal(firstRequest?.signal?.aborted, true);
    await f.settle(() => release(Response.json({ data: item })));
    assert.equal(f.current.item, undefined);
    assert.ok(f.renders.slice(switchIndex).every(value => !value.item));
    if (changed !== "unmount") await f.dispose();
  });
}

test("switching a fully loaded defect clears its snapshot on the first new render", async () => {
  let hold = false;
  let release!: (response: Response) => void;
  const delayed = new Promise<Response>(resolve => { release = resolve; });
  const f = await contextHarness(request => hold ? delayed : Response.json({ data: request.path.endsWith("/item-1") ? item : run }));
  try {
    assert.equal(f.current.item?.snapshot.title, "Immutable checkout title");
    hold = true; const switchIndex = f.renders.length;
    await f.update({ defect: { ...defect, id: "bug-2", runId: "run-2", runItemId: "item-2" } });
    assert.equal(f.current.pending, true); assert.equal(f.current.run, undefined); assert.equal(f.current.item, undefined);
    assert.ok(f.renders.slice(switchIndex).every(value => !value.item && !value.run));
    await f.settle(() => release(Response.json({ data: { ...run, id: "run-2" } })));
  } finally { await f.dispose(); }
});
