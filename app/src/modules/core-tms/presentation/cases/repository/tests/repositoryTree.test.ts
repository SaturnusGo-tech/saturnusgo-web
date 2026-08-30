import assert from "node:assert/strict";
import test from "node:test";
import type { TestCaseSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import { clampCaseRepositoryWidth } from "../../layout/useCaseRepositoryResize";
import { buildRepositoryTree, isRepositoryPathBranch } from "../repositoryTree";

function caseSummary(id: string, folderPath: string) {
  return { id, folderPath } as TestCaseSummary;
}

test("builds nested labels and rolls descendant cases into folder counts", () => {
  const tree = buildRepositoryTree([
    ["/Web/Auth", [caseSummary("login", "/Web/Auth")]],
    ["/Web/Auth/Recovery", [caseSummary("reset", "/Web/Auth/Recovery")]],
    ["/Web/Checkout", [caseSummary("cart", "/Web/Checkout")]],
  ]);

  assert.deepEqual(tree.map((folder) => folder.label), ["Web"]);
  assert.equal(tree[0].caseCount, 3);
  assert.deepEqual(tree[0].children.map((folder) => folder.label), ["Auth", "Checkout"]);
  assert.equal(tree[0].children[0].caseCount, 2);
  assert.equal(tree[0].children[0].children[0].label, "Recovery");
});

test("recognizes every ancestor of the current folder path", () => {
  assert.equal(isRepositoryPathBranch("/Web", "/Web/Auth/Recovery"), true);
  assert.equal(isRepositoryPathBranch("/Web/Auth", "/Web/Auth/Recovery"), true);
  assert.equal(isRepositoryPathBranch("/Mobile", "/Web/Auth/Recovery"), false);
});

test("bounds the resizable repository without starving the case document", () => {
  assert.equal(clampCaseRepositoryWidth(120, 1440), 230);
  assert.equal(clampCaseRepositoryWidth(480, 1440), 320);
  assert.equal(clampCaseRepositoryWidth(900, 1440), 320);
  assert.equal(clampCaseRepositoryWidth(500, 900), 240);
});
