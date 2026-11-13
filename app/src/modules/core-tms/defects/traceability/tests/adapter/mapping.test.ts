import assert from "node:assert/strict";
import test from "node:test";
import { mapDefect } from "../../../data/defect-mapper";
import { defectDto } from "../fixture/defect-dto";

test("preserves immutable source folder, shared revision and original occurrence attempt at the data boundary", () => {
  const result = mapDefect(defectDto);
  assert.equal(result.attemptNo, 1);
  assert.deepEqual(result.sourceLocation, { folderId: "folder-1", folderPath: "/Payments",
    capturedAt: "2026-11-13T00:00:00Z", origin: "run" });
  assert.equal(result.reproduction?.caseRevision, 3);
  assert.deepEqual(result.reproduction?.steps[0]?.sharedStep, { id: "shared-1", title: "Payment authorization", revision: 2 });
  assert.equal(result.reproduction?.steps[0]?.failed, true);
  assert.notEqual(result.sourceLocation, defectDto.sourceLocation);
  assert.notEqual(result.reproduction?.steps, defectDto.reproduction.steps);
});

test("missing legacy provenance stays unavailable instead of using the active case or shared scenario", () => {
  const { sourceLocation: _location, reproduction: _reproduction, ...legacy } = defectDto;
  const result = mapDefect(legacy);
  assert.equal(result.sourceLocation, null);
  assert.equal(result.reproduction, null);
});
