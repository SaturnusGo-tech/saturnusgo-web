import assert from "node:assert/strict";
import test from "node:test";
import type { RepositoryFolder } from "../../../../folders/model/folder";
import { navigationHarness } from "./navigation-harness";

const folder = { id: "folder-1", projectId: "project-1", path: "/Renamed/Payments", archivedAt: null };
const scopedPath = "/api/v1/workspaces/workspace-1/projects/project-1/folders/folder-1";

test("manual source click fetches its scoped stable folder and opens a fresh rename over the cached path", async t => {
  const stale = { ...folder, path: "/Cached" } as RepositoryFolder;
  const f = await navigationHarness(() => Response.json({ data: folder }), { folders: [stale] });
  t.after(() => f.dispose());
  assert.equal(f.requests.length, 0); assert.equal(f.current.canOpen, true);
  const saved = JSON.stringify(f.original.sourceLocation);
  const { work } = await f.start(); await f.settle(() => work);
  assert.deepEqual(f.requests.map(request => [request.method, request.path]), [["GET", scopedPath]]);
  assert.equal(f.requests[0]?.signal?.aborted, false);
  assert.deepEqual(f.destinations, [["project-1", "/Renamed/Payments", "folder-1"]]);
  assert.equal(f.current.pending, false); assert.equal(f.current.error, "");
  assert.equal(JSON.stringify(f.original.sourceLocation), saved);
});

for (const change of ["workspace", "project", "defect", "disconnect", "unmount"] as const) {
  test(`${change} change cancels source navigation and suppresses a late successful HTTP response`, async t => {
    let release!: (response: Response) => void;
    const delayed = new Promise<Response>(resolve => { release = resolve; });
    const f = await navigationHarness(() => delayed); t.after(() => f.dispose());
    const { work } = await f.start();
    assert.equal(f.current.pending, true); assert.equal(f.requests[0]?.path, scopedPath);
    const signal = f.requests[0]?.signal; assert.equal(signal?.aborted, false);
    const switchIndex = f.renders.length;
    if (change === "workspace") await f.update({ workspaceId: "workspace-2" });
    if (change === "project") await f.update({ defect: { ...f.original, projectId: "project-2" } });
    if (change === "defect") await f.update({ defect: { ...f.original, id: "bug-2" } });
    if (change === "disconnect") await f.update({ connected: false });
    if (change === "unmount") await f.dispose();
    assert.equal(signal?.aborted, true);
    // This fetch deliberately ignores cancellation and still completes successfully.
    await f.settle(async () => { release(Response.json({ data: folder })); await work; });
    assert.deepEqual(f.destinations, []);
    if (change !== "unmount") {
      assert.equal(f.current.pending, false); assert.equal(f.current.error, "");
      assert.ok(f.renders.slice(switchIndex).every(render => !render.pending && !render.error));
    }
  });
}

test("a second click cancels the first read and an older completion cannot navigate twice", async t => {
  let release!: (response: Response) => void;
  const delayed = new Promise<Response>(resolve => { release = resolve; });
  let reads = 0;
  const f = await navigationHarness(() => ++reads === 1 ? delayed : Response.json({ data: folder }));
  t.after(() => f.dispose());
  const first = await f.start(); assert.equal(f.current.pending, true);
  const second = await f.start(); await f.settle(() => second.work);
  assert.equal(f.requests[0]?.signal?.aborted, true);
  assert.equal(f.requests[1]?.signal?.aborted, false);
  assert.deepEqual(f.destinations, [["project-1", "/Renamed/Payments", "folder-1"]]);
  await f.settle(async () => { release(Response.json({ data: { ...folder, path: "/Old response" } })); await first.work; });
  assert.equal(f.destinations.length, 1); assert.equal(f.current.error, "");
});

test("an unavailable manual folder reports a retryable error without replacing the recorded location", async t => {
  let unavailable = true;
  const f = await navigationHarness(() => unavailable
    ? Response.json({ error: { code: "NOT_FOUND", message: "Folder is unavailable", requestId: "request-1" } }, { status: 404 })
    : Response.json({ data: folder }));
  t.after(() => f.dispose());
  const saved = structuredClone(f.original.sourceLocation);
  const first = await f.start(); await f.settle(() => first.work);
  assert.deepEqual(f.destinations, []); assert.equal(f.current.pending, false);
  assert.match(f.current.error, /source folder is unavailable/);
  assert.equal(f.current.canOpen, true); assert.deepEqual(f.original.sourceLocation, saved);
  unavailable = false;
  const retry = await f.start(); await f.settle(() => retry.work);
  assert.equal(f.current.error, ""); assert.equal(f.destinations.length, 1);
  assert.deepEqual(f.original.sourceLocation, saved);
});
