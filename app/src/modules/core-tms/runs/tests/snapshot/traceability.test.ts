import assert from "node:assert/strict";
import test from "node:test";
import { item } from "../../../defects/execution-context/tests/fixtures/execution-fixture";
import { mapRunItem } from "../../data/run-mapper";

test("run snapshot maps frozen flattened shared metadata without rebuilding a library group", () => {
  const dto = structuredClone(item);
  Object.assign(dto.snapshot.steps[0]!, { sharedStepId: "shared-1", sharedStepTitle: "Original login",
    sharedStepRevision: 3, sharedStepReferenceId: "reference-1", sharedStepItemId: "child-1" });
  const mapped = mapRunItem(dto);
  assert.equal(mapped.snapshot.steps.length, dto.snapshot.steps.length);
  assert.equal(mapped.snapshot.steps[0]?.sharedStepTitle, "Original login");
  assert.equal(mapped.snapshot.steps[0]?.sharedStepRevision, 3);
  assert.equal(mapped.snapshot.steps[0]?.sharedStepReferenceId, "reference-1");
  assert.equal(mapped.snapshot.steps[0]?.sharedStepItemId, "child-1");
  assert.equal(mapped.snapshot.steps[0]?.sharedStep, null);
  assert.notEqual(mapped.snapshot.steps[0]?.attachmentIds, dto.snapshot.steps[0]?.attachmentIds);
});

test("legacy flattened run steps keep absent shared provenance unknown", () => {
  const mapped = mapRunItem(item);
  assert.equal(mapped.snapshot.steps[0]?.sharedStepTitle, null);
  assert.equal(mapped.snapshot.steps[0]?.sharedStepRevision, null);
});
