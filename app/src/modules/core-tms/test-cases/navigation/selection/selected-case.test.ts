import assert from "node:assert/strict";
import test from "node:test";
import { resolveSelectedCase } from "./selected-case";
import { buildCaseDeepLink, readCaseDeepLink } from "../case-deep-link";
import { buildWorkspaceDeepLink } from "../../../state/navigation/workspace-deep-link";

const cases = [{ id: "first", projectId: "p" }, { id: "chosen", projectId: "p" }, { id: "foreign", projectId: "other" }];

test("opening the repository without an explicit case never selects the first row", () => {
  for (const id of [null, "", "missing"]) {
    assert.equal(resolveSelectedCase(cases, "p", id), undefined);
  }
  assert.equal(resolveSelectedCase([], "p", "chosen"), undefined);
});

test("explicit case links keep their target and cannot select another project's case", () => {
  const href = buildCaseDeepLink("https://tms.example/work/", { workspaceId: "w", projectId: "p", caseId: "chosen" });
  const link = readCaseDeepLink(href);
  assert.equal(resolveSelectedCase(cases, link.projectId!, link.caseId), cases[1]);
  assert.equal(resolveSelectedCase(cases, "p", "foreign"), undefined);
  assert.equal(resolveSelectedCase(cases, "other", "chosen"), undefined);
  assert.equal(resolveSelectedCase(cases, undefined, "chosen"), undefined);
});

test("returning to the case list removes the old case link and remains unselected on reload", () => {
  const href = buildWorkspaceDeepLink("https://tms.example/work/?workspaceId=w&projectId=p&caseId=chosen", {
    workspaceId: "w", projectId: "p", view: "cases", runId: null,
  });
  const link = readCaseDeepLink(href);
  assert.equal(link.projectId, "p");
  assert.equal(link.caseId, null);
  assert.equal(resolveSelectedCase(cases, link.projectId!, link.caseId), undefined);
});
