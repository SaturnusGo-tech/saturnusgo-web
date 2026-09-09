import assert from "node:assert/strict";
import test from "node:test";
import { folderChoiceAncestors, folderChoiceRows } from "../folder-choice-tree";

const options = ["/", "/Pay", "/Pay/Transfers", "/Pay/Transfers/International", "/Payments", "/Payments/Refunds"].map((value) => ({ value, label: value === "/" ? "Корень проекта" : value }));
test("opening ancestors exposes the selected destination while similar-name branches remain independent", () => {
  const expanded = folderChoiceAncestors("/Pay/Transfers/International");
  assert.deepEqual([...expanded], ["/Pay", "/Pay/Transfers"]);
  const rows = folderChoiceRows(options, expanded, "");
  assert.deepEqual(rows.map((row) => row.value), ["/", "/Pay", "/Pay/Transfers", "/Pay/Transfers/International", "/Payments"]);
  assert.equal(rows[3].depth, 2); assert.equal(rows[3].parent, "/Pay/Transfers");
  assert.equal(rows[1].hasChildren, true); assert.equal(rows[3].hasChildren, false);
});
test("deep search finds a collapsed destination and retains its breadcrumb context without expanding the tree", () => {
  const expanded = new Set<string>();
  const rows = folderChoiceRows(options, expanded, "  INTERNATIONAL  ");
  assert.equal(rows.length, 1); assert.equal(rows[0].name, "International");
  assert.equal(rows[0].value, "/Pay/Transfers/International"); assert.equal(rows[0].parent, "/Pay/Transfers");
  assert.equal(expanded.size, 0);
  assert.deepEqual(folderChoiceRows(options, expanded, "unmatched"), []);
});
test("sparse imported trees expose a child when its missing ancestors have no disclosure control", () => {
  const rows = folderChoiceRows([{ value: "/Imported/Deep/Child", label: "/Imported/Deep/Child" }], new Set(), "");
  assert.equal(rows.length, 1); assert.equal(rows[0].depth, 0); assert.equal(rows[0].name, "Child");
});
