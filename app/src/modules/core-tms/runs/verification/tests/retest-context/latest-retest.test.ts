import assert from "node:assert/strict";
import test from "node:test";
import { findLatestDefectRetest } from "../../application/defect/find-latest-defect-retest";
import { mapRun } from "../../../data/run-mapper";
import { run } from "../fixtures/verification-fixture";

test("latest retest uses persisted membership, not a name match or the original run", async () => {
  const runs = [mapRun({ ...run, id: "older", createdAt: "2026-09-01" }),
    mapRun({ ...run, id: "unrelated", createdAt: "2026-09-03" }),
    mapRun({ ...run, id: "latest", createdAt: "2026-09-02" }),
    mapRun({ ...run, id: "ordinary", configuration: {}, createdAt: "2026-09-04" })];
  const calls: string[] = [];
  const found = await findLatestDefectRetest(runs, "project-1", "bug-1", async id => {
    calls.push(id); return new Set(id === "unrelated" ? ["bug-2"] : ["bug-1"]);
  });
  assert.equal(found?.id, "latest"); assert.deepEqual(calls, ["unrelated", "latest"]);
  assert.equal(found?.build, run.build); assert.equal(found?.environment.name, "QA");
});

test("another project, archived runs and cancelled reads cannot supply metadata", async () => {
  const controller = new AbortController(); controller.abort();
  await assert.rejects(findLatestDefectRetest([mapRun(run)], "project-1", "bug-1", async () => new Set(), controller.signal));
  let reads = 0;
  const found = await findLatestDefectRetest([mapRun({ ...run, projectId: "other" }),
    mapRun({ ...run, id: "archived", archivedAt: run.createdAt })], "project-1", "bug-1", async () => { reads++; return new Set(); });
  assert.equal(found, null); assert.equal(reads, 0);
});
