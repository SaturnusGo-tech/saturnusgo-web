import assert from "node:assert/strict";
import test from "node:test";
import { canEditRunAttempt } from "./attempt-editing";
import { item, run } from "../step/fixtures/step-fixture";

test("only the active nonterminal attempt is editable, even when a historical attempt failed", () => {
  assert.equal(canEditRunAttempt(run, item()), true);
  const inconsistent = item(); inconsistent.attempts[0]!.status = "failed";
  assert.equal(canEditRunAttempt(run, inconsistent), false);
  const missing = item(); missing.activeAttemptNo = 99;
  assert.equal(canEditRunAttempt(run, missing), false);
  assert.equal(canEditRunAttempt(null, item()), false);
  assert.equal(canEditRunAttempt(run, null), false);
});
