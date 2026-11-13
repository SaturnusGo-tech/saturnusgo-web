import assert from "node:assert/strict";
import test from "node:test";
import type { Defect } from "../../../../../core/tms/contracts/legacy-contract";
import { defect } from "../../execution-context/tests/fixtures/execution-fixture";
import { resolveDefectSource } from "../model/resolveDefectSource";

const source: Defect = { ...defect, sourceCaseId: "case-1", sourceLocation: {
  folderId: "old-folder", folderPath: "/Old", capturedAt: "2026-11-13T00:00:00Z", origin: "run",
} };

test("opens the source case's current folder while retaining the historical display path", async () => {
  const location = await resolveDefectSource(source, async id => {
    assert.equal(id, "case-1");
    return { id, projectId: "project-1", folderId: "moved-folder", folderPath: "/Payments/Retry" };
  }, async () => null);
  assert.deepEqual(location, { projectId: "project-1", folderId: "moved-folder", folderPath: "/Payments/Retry" });
  assert.equal(source.sourceLocation?.folderPath, "/Old");
});

test("rejects unavailable or cross-project source cases without silently opening a historical folder", async () => {
  await assert.rejects(resolveDefectSource(source, async () => { throw new Error("Unavailable"); }, async () => null));
  await assert.rejects(resolveDefectSource(source, async id => ({ id, projectId: "other", folderId: null, folderPath: "/" }), async () => null));
  await assert.rejects(resolveDefectSource(source, async () => ({ id: "other-case", projectId: "project-1", folderId: null, folderPath: "/" }), async () => null));
});

test("manual folder navigation resolves stable identity after a rename and rejects archived destinations", async () => {
  const manual = { ...source, runId: null, sourceCaseId: null, sourceLocation: { ...source.sourceLocation!, origin: "manual" as const } };
  const readCase = async () => { throw new Error("Manual folder must not request a case"); };
  const folder = { id: "old-folder", projectId: "project-1", path: "/Renamed", archivedAt: null };
  assert.deepEqual(await resolveDefectSource(manual, readCase, async id => { assert.equal(id, folder.id); return folder; }), {
    projectId: "project-1", folderId: "old-folder", folderPath: "/Renamed",
  });
  await assert.rejects(resolveDefectSource(manual, readCase, async () => ({ ...folder, archivedAt: "2026-11-13" })));
  await assert.rejects(resolveDefectSource(manual, readCase, async () => null));
  await assert.rejects(resolveDefectSource(manual, readCase, async () => ({ ...folder, projectId: "other" })));
  await assert.rejects(resolveDefectSource(manual, readCase, async () => ({ ...folder, id: "other" })));
});

test("explicit root stays navigable while missing legacy provenance is unavailable", async () => {
  const root = { ...source, sourceCaseId: null, sourceLocation: { ...source.sourceLocation!, folderId: null, folderPath: "/" } };
  const readCase = async () => { throw new Error("No case read expected"); };
  assert.deepEqual(await resolveDefectSource(root, readCase, async () => null), { projectId: "project-1", folderId: null, folderPath: "/" });
  await assert.rejects(resolveDefectSource({ ...root, sourceLocation: null }, readCase, async () => null));
});
