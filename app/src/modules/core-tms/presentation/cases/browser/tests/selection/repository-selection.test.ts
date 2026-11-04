import assert from "node:assert/strict";
import test from "node:test";
import { browserHarness, elements } from "../browser-harness";

test("Select all selects the single maintenance-filter match in a 414-case repository", () => {
  const app = browserHarness();
  app.props.testCases = Array.from({ length: 414 }, (_, index) => ({
    ...app.items[index % 2], id: `case-${index}`, key: `PAY-${index + 1}`,
    maintenance: { status: index === 32 ? "needs_update" : "current", rowVersion: 1 },
  } as typeof app.items[number]));
  app.props.filters = { ...app.props.filters, maintenanceStatus: "needs_update" };
  assert.deepEqual(app.render().matchingRows.map(row => row.testCase.id), ["case-32"]);
  app.render().bulkSelection.selectAll();
  assert.deepEqual(app.render().bulkSelection.selectedIds, ["case-32"]);
  app.dispose();
});

test("Select all follows the filtered tree across folders, while Select in folder keeps its narrower scope", () => {
  const app = browserHarness();
  app.props.testCases = app.items.map(item => ({ ...item, title: "Matching case" }));
  app.props.selectedFolder = "/Payments/Transfers"; app.props.selectedFolderId = "transfer";
  app.props.query = "Matching"; app.render().setQlQuery("-priority:critical");
  app.render().bulkSelection.selectVisible();
  assert.deepEqual(app.render().bulkSelection.selectedIds, ["transfer-case"]);
  app.render().bulkSelection.selectAll();
  assert.deepEqual(app.render().bulkSelection.selectedIds.sort(), ["profile-case", "transfer-case"]);
  app.dispose();
});

test("Select all cannot select hidden active cases when search or archive has no selectable matches", () => {
  const app = browserHarness();
  app.props.query = "does not exist";
  assert.equal(app.render().selectableMatchingCount, 0);
  app.render().bulkSelection.selectAll();
  assert.deepEqual(app.render().bulkSelection.selectedIds, []);
  app.props.query = "transfer";
  const archive = elements(app.renderTree(), item => item.props["aria-label"] === "Show archived folders")[0];
  (archive.props.onClick as () => void)();
  app.renderTree();
  assert.equal(app.render().selectableMatchingCount, 0);
  app.render().bulkSelection.selectAll();
  assert.deepEqual(app.render().bulkSelection.selectedIds, []);
  app.dispose();
});

test("the table's explicit Select entire project action still includes cases outside its search", () => {
  const app = browserHarness();
  app.props.folders = undefined; app.props.query = "transfer";
  assert.deepEqual(app.render().rows.map(row => row.testCase.id), ["transfer-case"]);
  app.render().bulkSelection.selectAll();
  assert.deepEqual(app.render().bulkSelection.selectedIds.sort(), ["profile-case", "transfer-case"]);
  app.dispose();
});

