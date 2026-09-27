import assert from "node:assert/strict";
import { test } from "node:test";
import { fieldDraftError, normalizedFieldLabel, parseFieldValue } from "../../model/field-validation";
import { customValueConflict } from "../../application/field-errors";
import { TmsApiError } from "../../../../../core/tms/transport/http";
import { field, value } from "../support/fixtures";
test("typed values retain false/zero and reject lossy integer or non-finite input", () => {
  assert.equal(parseFieldValue("false", "boolean"), false); assert.equal(parseFieldValue("0", "integer"), 0);
  assert.equal(parseFieldValue("1.5", "number"), 1.5); assert.equal(parseFieldValue("1.5", "integer"), null);
  for (const text of ["Infinity", "NaN", "0x10", "1,2", "1e999"]) assert.equal(parseFieldValue(text, "number"), null);
  assert.equal(parseFieldValue("9007199254740992", "integer"), null); assert.equal(parseFieldValue(" x ", "string"), "x");
  assert.equal(normalizedFieldLabel(" ＡＣＭＥ  Team "), "acme team");
});
test("field identifiers follow the server's stable 64-character identifier format", () => {
  assert.equal(fieldDraftError(field, false), "");
  for (const identifier of ["Provider", "1provider", "", "a".repeat(65), "provider field"]) assert.ok(fieldDraftError({ ...field, identifier }, false));
});
test("only typed conflict responses expose candidates and malformed responses remain ordinary failures", () => {
  const conflict = (details: Record<string, unknown>) => new TmsApiError("Conflict", 409, null, "CONFLICT", null, details);
  assert.deepEqual(customValueConflict(conflict({ reason: "EXACT_VALUE_EXISTS", existingValue: value })), { kind: "exact", values: [value] });
  assert.deepEqual(customValueConflict(conflict({ reason: "SIMILAR_VALUES_EXIST", similarValues: [null, value, { id: "bad" }] })), { kind: "similar", values: [value] });
  assert.equal(customValueConflict(conflict({ reason: "EXACT_VALUE_EXISTS", existingValue: "wrong" })), null);
  assert.equal(customValueConflict(new Error("network")), null);
});
