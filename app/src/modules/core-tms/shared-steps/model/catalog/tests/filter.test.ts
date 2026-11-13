import assert from "node:assert/strict";
import test from "node:test";
import { filterSharedSteps, sharedStepSections } from "../shared-step-catalog";
import type { SharedStepSummary } from "../../shared-step";
const rows = [
  { id: "auth", title: "Sign in", folderPath: "/Host/Account" },
  { id: "payment", title: "Pay invoice", folderPath: "/Host/Payments" },
  { id: "other", title: "Create host", folderPath: "/Hostel" },
  { id: "root", title: "Common setup", folderPath: "/" },
] as SharedStepSummary[];
test("module selection includes descendants but excludes similarly named sibling modules", () => {
  assert.deepEqual(filterSharedSteps(rows, "", "/Host").map(row => row.id), ["auth", "payment"]);
  assert.deepEqual(filterSharedSteps(rows, "", "/").map(row => row.id), ["root"]);
});
test("search finds procedures by module path as well as title", () => {
  assert.deepEqual(filterSharedSteps(rows, "payments", "all").map(row => row.id), ["payment"]);
  assert.deepEqual(filterSharedSteps(rows, "sign", "all").map(row => row.id), ["auth"]);
});
test("catalog section choices include ancestors once", () => {
  assert.deepEqual(sharedStepSections(rows), ["/", "/Host", "/Host/Account", "/Host/Payments", "/Hostel"]);
});
