import type { components } from "../../../../../../core/tms/generated/tms-api";
import { mapRun } from "../../../data/run-mapper";
import type { RunEditResource, RunEditPort, RunMetadataPatch } from "../../model/run-edit";
import { createRunEditStore } from "../../application/run-edit-store";
import { buildClient } from "../../../builds/tests/support/build-fixture";
const time = "2026-09-27T00:00:00Z";
export const runDto: components["schemas"]["Run"] = { id: "run-a", projectId: "project-a", key: "QA-TR-1", name: "Release run",
  description: "Original notes", tags: ["mobile"], ownerIdentityId: "person-a", type: "smoke", status: "active",
  environment: { id: null, key: "", name: "", baseUrl: "", variableKeys: [] }, suiteId: null, suiteResolutionId: null,
  build: "", platformBuilds: [{ platform: "android", attachmentId: "existing-build", fileName: "release.apk", byteSize: 3, version: "1.0" },
    { platform: "ios", reference: "1.0 (100)" }], configuration: {}, itemCount: 1,
  progress: { total: 1, executed: 0, percent: 0, counts: { not_run: 1, in_progress: 0, failed: 0, passed: 0, skipped: 0, blocked: 0 } },
  attachmentIds: [], createdBy: "person-a", createdAt: time, updatedAt: time, startedAt: time, completedAt: null,
  abortedAt: null, abortReason: null, archivedAt: null, archivedBy: null, archiveReason: null,
  elapsedMilliseconds: 0, activeSince: time, measuredAt: time };
export function editFixture(save?: RunEditPort["save"]) {
  let current: RunEditResource = { data: mapRun(runDto), etag: '"run:run-a:3"' }; let loads = 0;
  const calls: { patch: RunMetadataPatch; etag: string; key: string }[] = [];
  const f = buildClient();
  const port: RunEditPort = {
    async load() { loads++; return structuredClone(current); },
    async save(id, patch, etag, key) {
      calls.push({ patch, etag, key });
      if (save) return save(id, patch, etag, key);
      current = { data: { ...current.data, ...patch, platformBuilds: patch.platformBuilds?.map(build => build.platform === "android"
        ? { ...build, version: build.version ?? "", fileName: "release.apk", byteSize: 3 } : build) ?? current.data.platformBuilds }, etag: '"run:run-a:4"' };
      return current;
    },
  };
  const store = createRunEditStore(port, f.client, "run-a", "project-a", false, () => {});
  return { store, calls, f, port, loads: () => loads, setCurrent: (value: RunEditResource) => { current = value; } };
}
