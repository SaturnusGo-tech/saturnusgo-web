import assert from "node:assert/strict";
import test from "node:test";
import { selectPortfolioProjects, togglePortfolioProject } from "../../model/project-selection";

test("portfolio selection supports one, several and all projects without mutating the catalog", () => {
  const catalog = [{ id: "client" }, { id: "host" }, { id: "api" }];
  let selected = togglePortfolioProject([], "client");
  assert.deepEqual(selectPortfolioProjects(catalog, selected), [catalog[0]]);
  selected = togglePortfolioProject(selected, "api");
  assert.deepEqual(selectPortfolioProjects(catalog, selected), [catalog[0], catalog[2]]);
  selected = togglePortfolioProject(selected, "client");
  assert.deepEqual(selectPortfolioProjects(catalog, selected), [catalog[2]]);
  assert.deepEqual(selectPortfolioProjects(catalog, togglePortfolioProject(selected, "all")), catalog);
  assert.equal(catalog.length, 3);
});
test("the whole portfolio includes new projects, while removed selected projects do not leak unrelated cases", () => {
  const projects = [{ id: "new" }];
  assert.deepEqual(selectPortfolioProjects(projects, []), projects);
  assert.deepEqual(selectPortfolioProjects(projects, ["removed"]), []);
  assert.deepEqual(togglePortfolioProject(["removed"], "removed"), []);
});
