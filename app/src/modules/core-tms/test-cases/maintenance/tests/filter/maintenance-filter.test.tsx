import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { TestCaseSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import { TmsHttpClientProvider } from "../../../../auth/http/TmsHttpClientContext";
import { listTestCases } from "../../../data/test-case-api";
import { mergeMaintenance } from "../../model/case-maintenance";
(globalThis as typeof globalThis & { React: typeof React }).React = React;
require.extensions[".css"] = module => { module.exports = {}; };
const { useSelectionFilters } = require("../../../../presentation/cases/selection/controls/SelectionControls") as typeof import("../../../../presentation/cases/selection/controls/SelectionControls");
const current = { status: "current", rowVersion: 0, updatedBy: null, updatedAt: null, note: null, source: null, etag: "m0" } as const;
const marked = { ...current, status: "needs_update", rowVersion: 2 } as const;
const cases = [{ id: "marked", maintenance: marked, lifecycle: "ready" }, { id: "clear", maintenance: current, lifecycle: "ready" }, { id: "legacy", lifecycle: "draft" }].map(item => ({
  ...item, lifecycle: item.lifecycle as "ready" | "draft", currentRevision: 1, ownerIdentityId: null, estimatedMinutes: null, revisionCount: 1, createdAt: "2026-11-04T00:00:00Z", updatedAt: "2026-11-04T00:00:00Z", etag: "case-etag", projectId: "p", key: item.id, title: item.id, component: "Auth", tags: [], folderPath: "/", type: "manual", priority: "medium", archivedAt: null,
})) as TestCaseSummary[];
test("maintenance intersects existing filters and absent legacy projections remain current", async () => {
  let state: ReturnType<typeof useSelectionFilters>;
  function Probe() { state = useSelectionFilters(cases, { filters: { type: "all", priority: "all", lifecycle: "ready", tag: "", includeArchived: false, maintenanceStatus: "needs_update" } }); return null; }
  let view!: ReactTestRenderer; await act(async () => { view = create(<TmsHttpClientProvider client={{} as TmsHttpClient}><Probe /></TmsHttpClientProvider>); });
  assert.deepEqual(state!.visible.map(item => item.id), ["marked"]);
  await act(async () => state!.setFilters({ ...state!.filters, lifecycle: "all", maintenanceStatus: "current" }));
  assert.deepEqual(state!.visible.map(item => item.id), ["clear", "legacy"]);
  await act(async () => view.unmount());
});
test("server case lists receive maintenanceStatus without changing pagination or archive defaults", async () => {
  let path = "";
  const http = { get: async (value: string) => { path = value; return { data: [], meta: { hasMore: false, nextCursor: null } }; } } as unknown as TmsHttpClient;
  await listTestCases(http, "p", undefined, "needs_update");
  const url = new URL(path, "https://test");
  assert.equal(url.searchParams.get("maintenanceStatus"), "needs_update"); assert.equal(url.searchParams.get("includeArchived"), "true");
});
test("confirmed maintenance updates preserve immutable revision and outcome data and ignore older projections", () => {
  const revision = Object.freeze({ revision: 5, title: "Repaired", status: "passed" });
  const item = { id: "marked", maintenance: marked, current: revision, activeAttemptNo: 2, status: "passed", etag: "case-etag" };
  const clear = mergeMaintenance(item, item.id, { ...current, rowVersion: 3 });
  assert.equal(clear.current, revision); assert.equal(clear.status, "passed"); assert.equal(clear.etag, "case-etag");
  assert.equal(clear.maintenance.status, "current");
  assert.equal(mergeMaintenance(clear, clear.id, marked), clear);
  assert.equal(mergeMaintenance(item, "another", current), item);
});
