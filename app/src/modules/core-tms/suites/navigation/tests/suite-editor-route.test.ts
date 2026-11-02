import assert from "node:assert/strict";
import test from "node:test";
import { buildSuiteEditorRoute, buildSuiteRoute, readSuiteEditorRoute, readSuiteRoute } from "../suite-route";

const base = "https://falcon.test/work/?workspaceId=w&projectId=p&view=suites&suiteId=s1";
test("create and edit routes remain scoped and do not invent a suite resource", () => {
  const create = buildSuiteEditorRoute(base, "w", "p", null);
  assert.equal(readSuiteEditorRoute(create, "w", "p"), "new");
  assert.equal(readSuiteRoute(create, "w", "p"), null);
  assert.equal(readSuiteEditorRoute(create, "w", "other"), null);
  const edit = buildSuiteEditorRoute(base, "w", "p", "s1");
  assert.equal(readSuiteEditorRoute(edit, "w", "p"), "edit");
  assert.equal(readSuiteRoute(edit, "w", "p"), "s1");
});
test("returning to a suite or the catalog clears editor state", () => {
  const edit = buildSuiteEditorRoute(base, "w", "p", "s1");
  assert.equal(readSuiteEditorRoute(buildSuiteRoute(edit, "w", "p", "s1"), "w", "p"), null);
  assert.equal(new URL(buildSuiteRoute(edit, "w", "p", null)).searchParams.has("suiteId"), false);
  assert.equal(readSuiteEditorRoute("https://falcon.test/?workspaceId=w&projectId=p&view=suites&suiteEdit=edit", "w", "p"), null);
});
