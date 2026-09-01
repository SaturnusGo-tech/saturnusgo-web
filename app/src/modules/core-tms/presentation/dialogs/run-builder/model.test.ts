import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import {
  createDefaultRunName,
  filterRunCases,
  initialRunScopeFilters,
  reconcileRunScopeFilters,
  runScopeFacetOptions,
  updateRunScopeComponents,
  updateRunScopeFolders,
} from "./model";

const makeCase = (value: Partial<TestCaseSummary> & Pick<TestCaseSummary, "id" | "key" | "title">): TestCaseSummary => ({
  projectId: "project-1", folderPath: "/Host", currentRevision: 1, type: "manual",
  lifecycle: "ready", priority: "medium", component: "Core", ownerIdentityId: null,
  tags: ["Host", "Ui", "Positive", "Ios", "Android"], estimatedMinutes: 2,
  revisionCount: 1, archivedAt: null, createdAt: "2026-08-29T00:00:00Z",
  updatedAt: "2026-08-29T00:00:00Z", ...value,
  etag: value.etag ?? '"case:1"',
});

const cases = [
  makeCase({ id: "1", key: "HOST-TC-10", title: "Positive checkout" }),
  makeCase({ id: "2", key: "HOST-TC-2", title: "Blocked payment", folderPath: "/Host/Payments", tags: ["Host", "Ui", "Negative", "Android"], priority: "critical", component: "Payments" }),
  makeCase({ id: "3", key: "HOST-TC-1", title: "Boundary amount", folderPath: "/Host/Payments/Amount", tags: ["Host", "Ui", "Corner", "Ios"], component: "Payments" }),
  makeCase({ id: "4", key: "HOST-TC-11", title: "Restore archived item", folderPath: "/Host/Archive", component: "Archive" }),
  makeCase({ id: "5", key: "HOST-TC-12", title: "Archive error state", folderPath: "/Host/Archive/Errors", component: "Error recovery" }),
];

test("run filters combine facets and search without losing the full collection", () => {
  const result = filterRunCases(cases, {
    ...initialRunScopeFilters,
    query: "amount HOST",
    scenario: "corner",
    platform: "ios",
    components: ["Payments"],
    folders: ["/Host/Payments"],
  });
  assert.deepEqual(result.map((item) => item.id), ["3"]);
  assert.equal(cases.length, 5);
});

test("component filter matches any selected component", () => {
  const result = filterRunCases(cases, {
    ...initialRunScopeFilters,
    components: ["Core", "Payments"],
  });
  assert.deepEqual(result.map((item) => item.id).sort(), ["1", "2", "3"]);
});

test("folder and component filters both use OR within their facet", () => {
  const result = filterRunCases(cases, {
    ...initialRunScopeFilters,
    components: ["Payments", "Archive"],
    folders: ["/Host/Payments", "/Host/Archive"],
  });
  assert.deepEqual(result.map((item) => item.id).sort(), ["2", "3", "4"]);
});

test("folder selection exposes only components from its subtree", () => {
  const facets = runScopeFacetOptions(cases, {
    ...initialRunScopeFilters,
    folders: ["/Host/Archive"],
  });
  assert.deepEqual(facets.components, ["Archive", "Error recovery"]);
  assert.ok(!facets.components.includes("Payments"));
});

test("component selection exposes only folders that contain matching cases", () => {
  const facets = runScopeFacetOptions(cases, {
    ...initialRunScopeFilters,
    components: ["Payments"],
  });
  assert.deepEqual(facets.folders, ["/Host", "/Host/Payments", "/Host/Payments/Amount"]);
  assert.ok(!facets.folders.includes("/Host/Archive"));
});

test("changing folders removes components that cannot exist in the new scope", () => {
  const next = updateRunScopeFolders(cases, {
    ...initialRunScopeFilters,
    components: ["Archive", "Payments"],
    folders: ["/Host/Payments"],
  }, ["/Host/Archive"]);
  assert.deepEqual(next.folders, ["/Host/Archive"]);
  assert.deepEqual(next.components, ["Archive"]);
});

test("changing components removes folders that cannot contain them", () => {
  const next = updateRunScopeComponents(cases, {
    ...initialRunScopeFilters,
    components: ["Archive"],
    folders: ["/Host/Archive", "/Host/Payments"],
  }, ["Payments"]);
  assert.deepEqual(next.components, ["Payments"]);
  assert.deepEqual(next.folders, ["/Host/Payments"]);
});

test("nested cases expose every repository ancestor without duplicating the all-folders state", () => {
  const nestedOnly = [makeCase({
    id: "nested", key: "HOST-TC-100", title: "Nested error",
    folderPath: "/Host/Archive/Errors", component: "Error recovery",
  })];
  const facets = runScopeFacetOptions(nestedOnly, initialRunScopeFilters);
  assert.deepEqual(facets.folders, ["/Host", "/Host/Archive", "/Host/Archive/Errors"]);
  assert.ok(!facets.folders.includes("/"));
});

test("folder subtree matching respects segment boundaries", () => {
  const boundaryCases = [
    makeCase({ id: "archive", key: "TC-1", title: "Archive", folderPath: "/Host/Archive" }),
    makeCase({ id: "archive-old", key: "TC-2", title: "Archive old", folderPath: "/Host/Archive-old" }),
  ];
  const result = filterRunCases(boundaryCases, {
    ...initialRunScopeFilters,
    folders: ["/Host/Archive"],
  });
  assert.deepEqual(result.map((item) => item.id), ["archive"]);
});

test("reconciliation removes deleted and unknown structural selections", () => {
  const selected = {
    ...initialRunScopeFilters,
    folders: ["/Host/Archive", "/Unknown"],
    components: ["Archive", "Unknown component"],
  };
  const withoutArchive = cases.filter((item) => !item.folderPath.startsWith("/Host/Archive"));
  const next = reconcileRunScopeFilters(withoutArchive, selected);
  assert.deepEqual(next.folders, []);
  assert.deepEqual(next.components, []);
});

test("edited facet values are canonicalized and cannot retain unknown filters", () => {
  const folders = updateRunScopeFolders(cases, initialRunScopeFilters, ["Host//Archive", "/Unknown"]);
  assert.deepEqual(folders.folders, ["/Host/Archive"]);
  const components = updateRunScopeComponents(cases, folders, ["Archive", "Unknown component"]);
  assert.deepEqual(components.components, ["Archive"]);
});

test("selecting every visible dependent option remains an explicit selection", () => {
  const source = readFileSync(
    new URL("../../common/select/AnimatedMultiSelect.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /onChange\(next\);/);
  assert.doesNotMatch(source, /next\.length\s*===\s*options\.length/);
});

test("key sorting is numeric and predictable", () => {
  const result = filterRunCases(cases, { ...initialRunScopeFilters, sort: "key_asc" });
  assert.deepEqual(result.map((item) => item.key), ["HOST-TC-1", "HOST-TC-2", "HOST-TC-10", "HOST-TC-11", "HOST-TC-12"]);
});

test("default run names carry human-readable execution context", () => {
  assert.equal(createDefaultRunName({
    projectName: "Umbrella Host", scope: "HOST-TC-240", typeLabel: "Разовый",
    build: "local-current", timestamp: "29 авг., 15:42:07",
  }), "Umbrella Host · HOST-TC-240 · Разовый · local-current · 29 авг., 15:42:07");
});
