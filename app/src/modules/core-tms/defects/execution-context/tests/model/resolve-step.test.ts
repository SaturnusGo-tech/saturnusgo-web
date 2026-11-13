import assert from "node:assert/strict";
import test from "node:test";
import { mapRunItem } from "../../../../runs/data/run-mapper";
import { resolveDefectExecutionStep } from "../../model/resolveDefectExecutionStep";
import { item } from "../fixtures/execution-fixture";

test("resolves the exact failed step and checklist text from the immutable run-item revision", () => {
  const original = mapRunItem(item);
  assert.deepEqual(resolveDefectExecutionStep(original, "step-2"), {
    kind: "step", order: 2, text: "Pay from original snapshot",
  });
  assert.deepEqual(resolveDefectExecutionStep(original, "check-1"), {
    kind: "checklist", order: 3, text: "Original confirmation",
  });
  assert.equal(resolveDefectExecutionStep(original, "missing"), null);
  assert.equal(resolveDefectExecutionStep(original, null), null);
  assert.equal(resolveDefectExecutionStep(undefined, "step-2"), null);
});

test("uses shared-step child snapshots without retrieving mutable shared-step definitions", () => {
  const original = mapRunItem(item);
  original.snapshot.steps[1].sharedStep = { id: "shared-1", title: "Original shared flow", revision: 4,
    items: [{ id: "child-1", order: 2, action: "Original shared action", expectedResult: "Done", required: true }] };
  assert.deepEqual(resolveDefectExecutionStep(original, "child-1"), {
    kind: "step", order: 2, text: "Original shared action",
  });
  assert.deepEqual(resolveDefectExecutionStep(original, "step-2"), {
    kind: "step", order: 2, text: "Pay from original snapshot",
  });
  original.snapshot.steps[0].sharedStep = original.snapshot.steps[1].sharedStep;
  assert.equal(resolveDefectExecutionStep(original, "child-1"), null);
});
