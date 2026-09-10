import assert from "node:assert/strict";
import { test } from "node:test";
import { companyViewAvailable } from "../../domain/features/company-features";

void test("company capabilities restrict navigation and restored deep links while help stays available", () => {
  for (const view of ["dashboard", "api", "hooks"] as const) assert.equal(companyViewAvailable(view, ["core"]), false);
  for (const view of ["cases", "suites", "runs", "help", "config"] as const) assert.equal(companyViewAvailable(view, ["core"]), true);
  assert.equal(companyViewAvailable("dashboard", ["core", "analytics"]), true);
  assert.equal(companyViewAvailable("hooks", ["core", "integrations"]), true);
  assert.equal(companyViewAvailable("dashboard", undefined), true);
});
