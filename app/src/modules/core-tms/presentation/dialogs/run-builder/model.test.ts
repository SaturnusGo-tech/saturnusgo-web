import assert from "node:assert/strict";
import test from "node:test";
import type { TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { createDefaultRunName, filterRunCases, initialRunScopeFilters } from "./model";

const makeCase = (value: Partial<TestCaseSummary> & Pick<TestCaseSummary, "id" | "key" | "title">): TestCaseSummary => ({
  projectId: "project-1", folderPath: "/Host", currentRevision: 1, type: "manual",
  lifecycle: "ready", priority: "medium", component: "Core", ownerIdentityId: null,
  tags: ["Host", "Ui", "Positive", "Ios", "Android"], estimatedMinutes: 2,
  revisionCount: 1, archivedAt: null, createdAt: "2026-08-29T00:00:00Z",
  updatedAt: "2026-08-29T00:00:00Z", ...value,
});

const cases = [
  makeCase({ id: "1", key: "HOST-TC-10", title: "Positive checkout" }),
  makeCase({ id: "2", key: "HOST-TC-2", title: "Blocked payment", folderPath: "/Host/Payments", tags: ["Host", "Ui", "Negative", "Android"], priority: "critical", component: "Payments" }),
  makeCase({ id: "3", key: "HOST-TC-1", title: "Boundary amount", folderPath: "/Host/Payments/Amount", tags: ["Host", "Ui", "Corner", "Ios"], component: "Payments" }),
];

test("run filters combine facets and search without losing the full collection", () => {
  const result = filterRunCases(cases, {
    ...initialRunScopeFilters,
    query: "amount HOST",
    scenario: "corner",
    platform: "ios",
    component: "Payments",
    folder: "/Host/Payments",
  });
  assert.deepEqual(result.map((item) => item.id), ["3"]);
  assert.equal(cases.length, 3);
});

test("key sorting is numeric and predictable", () => {
  const result = filterRunCases(cases, { ...initialRunScopeFilters, sort: "key_asc" });
  assert.deepEqual(result.map((item) => item.key), ["HOST-TC-1", "HOST-TC-2", "HOST-TC-10"]);
});

test("default run names carry human-readable execution context", () => {
  assert.equal(createDefaultRunName({
    projectName: "Umbrella Host", scope: "HOST-TC-240", typeLabel: "Разовый",
    build: "local-current", timestamp: "29 авг., 15:42:07",
  }), "Umbrella Host · HOST-TC-240 · Разовый · local-current · 29 авг., 15:42:07");
});
