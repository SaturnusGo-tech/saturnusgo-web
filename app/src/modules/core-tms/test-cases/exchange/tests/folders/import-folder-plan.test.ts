import assert from "node:assert/strict";
import test from "node:test";
import type { RepositoryFolder } from "../../../../folders/model/folder";
import { buildImportPlan } from "../../application/preview/build-import-plan";
import { parseTestCaseExchange } from "../../validation/parse-test-case-exchange";
import { validateImportFolderPath } from "../../validation/folder-path";
import { TEST_CASE_EXCHANGE_SCHEMA, LEGACY_TEST_CASE_EXCHANGE_SCHEMA } from "../../model/test-case-exchange";

const existing = [{ id: "folder-existing", path: "/Existing", name: "Existing", parentId: null,
  workspaceId: "workspace", projectId: "project", archivedAt: null }] as RepositoryFolder[];
function source(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({ schemaVersion: TEST_CASE_EXCHANGE_SCHEMA, exportedAt: "2026-09-09", project: { key: "QA", name: "Quality" },
    folders: ["/Empty", "/Payments/Nested"], testCases: [{ title: "Transfer", folderPath: "/Payments" },
      { title: "Root case", folderPath: "/" }], ...overrides });
}
test("adds the complete imported hierarchy inside the chosen existing destination and preserves empty folders", () => {
  const plan = buildImportPlan(parseTestCaseExchange(source()), "/Existing", existing);
  assert.deepEqual(plan.document.testCases.map((item) => item.folderPath), ["/Existing/Payments", "/Existing"]);
  assert.deepEqual(plan.folders.map((item) => item.path), ["/Existing", "/Existing/Empty", "/Existing/Payments", "/Existing/Payments/Nested"]);
  assert.equal(plan.newFolderCount, 3);
  assert.equal(plan.existingFolderCount, 1);
  assert.deepEqual(plan.folders.find((item) => item.path === "/Existing/Payments")?.caseIndices, [0]);
  assert.deepEqual(plan.folders.find((item) => item.path === "/Existing")?.caseIndices, [1]);
  assert.equal(plan.folders.find((item) => item.path.endsWith("/Empty"))?.caseIndices.length, 0);
});
test("accepts legacy v1/v2 exports and folder-only additive v2 documents", () => {
  for (const schemaVersion of [LEGACY_TEST_CASE_EXCHANGE_SCHEMA, TEST_CASE_EXCHANGE_SCHEMA]) {
    const parsed = parseTestCaseExchange(source({ schemaVersion, folders: undefined }));
    assert.equal(parsed.folders, undefined);
    assert.equal(buildImportPlan(parsed, "/", []).rootCaseIndices.length, 1);
  }
  const foldersOnly = buildImportPlan(parseTestCaseExchange(source({ testCases: [] })), "/", []);
  assert.equal(foldersOnly.document.testCases.length, 0);
  assert.equal(foldersOnly.newFolderCount, 3);
});
test("rejects ambiguous, noncanonical and excessively long combined paths before mutation", () => {
  for (const path of ["missing-root", "/A//B", "/A/", "/A/../B", "/./A", "/ leading", "/tail ", "/A\\B", "/A\nB"]) {
    assert.throws(() => validateImportFolderPath(path), /Invalid folder path/);
  }
  assert.throws(() => parseTestCaseExchange(source({ folders: ["/Empty", "/Empty"] })), /unique/);
  assert.throws(() => parseTestCaseExchange(source({ folders: ["/Trailing "] })), /Invalid folder path/);
  assert.throws(() => parseTestCaseExchange(source({ testCases: [{ title: "Case", folderPath: " /Leading" }] })), /Invalid folder path/);
  assert.throws(() => buildImportPlan(parseTestCaseExchange(source()), "/Unavailable", existing), /unavailable/);
  const long = `/${"A".repeat(120)}/${"B".repeat(120)}/${"C".repeat(120)}/${"D".repeat(120)}/E`;
  const longExisting = [{ ...existing[0], path: long }] as RepositoryFolder[];
  assert.throws(() => buildImportPlan(parseTestCaseExchange(source()), long, longExisting), /Invalid folder path/);
});
