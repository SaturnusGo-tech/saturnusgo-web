import assert from "node:assert/strict";
import test from "node:test";
import type { TestCaseRevision } from "../../../../../../core/tms/contracts/legacy-contract";
import {
  changeRevisionType,
  discardedProcedureCount,
  normalizeRevisionTags,
  revisionTagsAreValid,
} from "../../../../helpers/cases/caseRevision";
import {
  canRemoveInspectorRow,
  copyInspectorRevision,
  editorSessionClosed,
  inspectorRevisionProblem,
  inspectorSectionForMode,
  inspectorTabAfterKey,
  inspectorTabsForMode,
  isInspectorSectionEditing,
  restoreInspectorSection,
} from "../model";

const revision: TestCaseRevision = {
  revision: 2,
  title: "Checkout",
  description: "Original description",
  preconditions: "Signed in",
  type: "manual",
  lifecycle: "ready",
  priority: "high",
  component: "Payments",
  ownerIdentityId: "qa-1",
  tags: ["smoke"],
  estimatedMinutes: 5,
  testData: "Visa",
  steps: [{
    id: "step-1",
    order: 1,
    action: "Pay",
    expectedResult: "Approved",
    required: true,
    attachmentIds: ["attachment-1"],
  }],
  checklist: [],
  attachmentIds: ["attachment-2"],
  changeNote: "Created",
  createdAt: "2026-08-31T00:00:00.000Z",
};

test("copyInspectorRevision owns every mutable collection", () => {
  const copy = copyInspectorRevision(revision);
  assert.notEqual(copy.steps, revision.steps);
  assert.notEqual(copy.steps[0], revision.steps[0]);
  assert.notEqual(copy.steps[0].attachmentIds, revision.steps[0].attachmentIds);
  assert.notEqual(copy.tags, revision.tags);
  assert.notEqual(copy.attachmentIds, revision.attachmentIds);
});

test("restoreInspectorSection only rolls back the active section", () => {
  const changed = {
    ...revision,
    title: "Keep changed title",
    description: "Changed description",
    component: "Core",
    preconditions: "Changed preconditions",
    steps: [{ ...revision.steps[0], action: "Changed action" }],
  };
  const description = restoreInspectorSection(changed, revision, "description");
  assert.equal(description.description, revision.description);
  assert.equal(description.title, "Keep changed title");
  assert.equal(description.component, "Core");
  const steps = restoreInspectorSection(changed, revision, "steps");
  assert.equal(steps.steps[0].action, "Pay");
  assert.equal(steps.preconditions, "Changed preconditions");
  const details = restoreInspectorSection({
    ...changed,
    testData: "Changed data",
    ownerIdentityId: "qa-2",
    tags: ["regression"],
    changeNote: "Changed note",
  }, revision, "details");
  assert.equal(details.testData, "Visa");
  assert.equal(details.ownerIdentityId, "qa-1");
  assert.deepEqual(details.tags, ["smoke"]);
  assert.equal(details.title, "Keep changed title");
});

test("tab keyboard navigation wraps and supports boundary keys", () => {
  assert.equal(inspectorTabAfterKey("overview", "ArrowLeft"), "activity");
  assert.equal(inspectorTabAfterKey("activity", "ArrowRight"), "overview");
  assert.equal(inspectorTabAfterKey("files", "Home"), "overview");
  assert.equal(inspectorTabAfterKey("overview", "End"), "activity");
});

test("pending evidence clears only when an editor session closes", () => {
  assert.equal(editorSessionClosed(true, false), true);
  assert.equal(editorSessionClosed(true, true), false);
  assert.equal(editorSessionClosed(false, true), false);
  assert.equal(editorSessionClosed(false, false), false);
});

test("create mode starts in General and initializes its first local editor", () => {
  assert.equal(inspectorSectionForMode("create"), "description");
  assert.equal(inspectorSectionForMode("edit"), null);
  assert.deepEqual(inspectorTabsForMode(true), ["overview"]);
  assert.deepEqual(inspectorTabsForMode(false), [
    "overview", "files", "activity",
  ]);
});

test("create mode exposes every section in the single inspector form", () => {
  const sections = [
    "description", "component", "preconditions", "details", "steps",
  ] as const;
  for (const section of sections) {
    assert.equal(isInspectorSectionEditing("create", "description", section), true);
  }
  assert.equal(isInspectorSectionEditing("edit", "description", "description"), true);
  assert.equal(isInspectorSectionEditing("edit", "description", "steps"), false);
});

test("edit mode can expose several independently editable sections", () => {
  const active = new Set(["description", "steps"] as const);
  assert.equal(isInspectorSectionEditing("edit", active, "description"), true);
  assert.equal(isInspectorSectionEditing("edit", active, "steps"), true);
  assert.equal(isInspectorSectionEditing("edit", active, "details"), false);
});

test("manual revisions require one complete step and keep the final row", () => {
  assert.equal(inspectorRevisionProblem(revision, "/Main"), null);
  assert.equal(inspectorRevisionProblem({ ...revision, steps: [] }, "/Main"), "manualSteps");
  assert.equal(inspectorRevisionProblem({
    ...revision,
    steps: [{ ...revision.steps[0], expectedResult: "  " }],
  }, "/Main"), "manualSteps");
  assert.equal(canRemoveInspectorRow(1), false);
  assert.equal(canRemoveInspectorRow(2), true);
});

test("automated revisions require one complete step and keep the final row", () => {
  assert.equal(inspectorRevisionProblem({ ...revision, type: "automated", steps: [] }, "/Main"), "automatedSteps");
  assert.equal(inspectorRevisionProblem({
    ...revision,
    type: "automated",
    steps: [{ ...revision.steps[0], action: " " }],
  }, "/Main"), "automatedSteps");
  assert.equal(inspectorRevisionProblem({ ...revision, type: "automated" }, "/Main"), null);
  assert.equal(canRemoveInspectorRow(1), false);
});

test("type changes clear only incompatible procedure data and preserve tags", () => {
  const automated = changeRevisionType(revision, "automated");
  assert.equal(automated.type, "automated");
  assert.deepEqual(automated.steps, revision.steps);
  assert.deepEqual(automated.checklist, []);
  assert.deepEqual(automated.tags, ["smoke"]);

  const checklist = changeRevisionType(revision, "checklist");
  assert.equal(discardedProcedureCount(revision, "checklist"), 1);
  assert.equal(discardedProcedureCount({
    ...revision,
    steps: [{ ...revision.steps[0], action: "", expectedResult: "", testData: "", attachmentIds: [] }],
  }, "checklist"), 0);
  assert.equal(discardedProcedureCount({
    ...revision,
    steps: [{ ...revision.steps[0], action: "", expectedResult: "", testData: "" }],
  }, "checklist"), 1);
  assert.equal(discardedProcedureCount(revision, "automated"), 0);
  assert.deepEqual(checklist.steps, []);
  const backToAutomated = changeRevisionType({
    ...checklist,
    checklist: [{ id: "check-1", order: 1, text: "Healthy", required: true }],
  }, "automated");
  assert.equal(discardedProcedureCount({
    ...checklist,
    checklist: [{ id: "check-1", order: 1, text: " ", required: true }],
  }, "automated"), 0);
  assert.equal(discardedProcedureCount({
    ...checklist,
    checklist: [{ id: "check-1", order: 1, text: "Healthy", required: true }],
  }, "automated"), 1);
  assert.deepEqual(backToAutomated.checklist, []);
  assert.deepEqual(backToAutomated.tags, ["smoke"]);
});

test("tag normalization preserves values and order without blank duplicates", () => {
  assert.deepEqual(
    normalizeRevisionTags([" Smoke ", "ci.backend", "", "smoke", "OWNER-team-a"]),
    ["smoke", "ci.backend", "owner-team-a"],
  );
  assert.equal(revisionTagsAreValid(["smoke", "ci.backend", "owner-team-a"]), true);
  assert.equal(revisionTagsAreValid(["invalid tag"]), false);
  assert.equal(revisionTagsAreValid([`a${"b".repeat(64)}`]), false);
  assert.equal(inspectorRevisionProblem({ ...revision, tags: ["invalid tag"] }, "/Main"), "tags");
});
