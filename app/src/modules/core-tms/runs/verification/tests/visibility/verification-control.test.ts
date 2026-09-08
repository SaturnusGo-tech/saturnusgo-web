import assert from "node:assert/strict";
import test from "node:test";
import { showVerificationControl } from "../../presentation/queue/visibility";
const base = { enabled: true, data: null, unresolved: false, pendingStart: false, error: "" };
test("verification stays hidden before loading and when no linked scenarios need retesting", () => {
  assert.equal(showVerificationControl(base), false);
  assert.equal(showVerificationControl({ ...base, data: { totalCases: 0 } }), false);
  assert.equal(showVerificationControl({ ...base, data: { totalCases: 0 }, error: "refresh failed" }), false);
});
test("ready scenarios can create a run even if the project has no existing runs", () => {
  assert.equal(showVerificationControl({ ...base, data: { totalCases: 5 } }), true);
});
test("an interrupted verification remains recoverable after its queue is consumed", () => {
  assert.equal(showVerificationControl({ ...base, data: { totalCases: 0 }, unresolved: true }), true);
  assert.equal(showVerificationControl({ ...base, data: { totalCases: 0 }, pendingStart: true }), true);
});
test("unknown queue failure exposes retry, but never bypasses access permissions", () => {
  assert.equal(showVerificationControl({ ...base, error: "load failed" }), true);
  assert.equal(showVerificationControl({ ...base, enabled: false, unresolved: true, error: "load failed" }), false);
});
