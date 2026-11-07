import assert from "node:assert/strict";
import { test } from "node:test";
import { getSidebarNavigation, SIDEBAR_NAVIGATION_IDS } from "../../model/sidebar-navigation";
import type { View } from "../../../../state/types/workspace";

const core = ["dashboard", "cases", "shared-steps", "runs", "suites", "reports"];
const navigation = (view: View, pinned: readonly View[] = [], availableIds: readonly View[] = SIDEBAR_NAVIGATION_IDS.filter(id => id !== "product-docs"), mode = "all" as "all" | "contextual") =>
  getSidebarNavigation({ activeView: view, availableIds, preferences: { mode, pinned } });

test("legacy modes keep the six primary sections visible and rare services in overflow", () => {
  for (const mode of ["all", "contextual"] as const) {
    const result = navigation("cases", [], SIDEBAR_NAVIGATION_IDS.filter(id => id !== "product-docs").reverse(), mode);
    assert.deepEqual(result.visibleIds, core);
    assert.deepEqual(result.hiddenIds, ["portfolios", "custom-fields", "api", "hooks"]);
    assert.deepEqual(result.groups.map(group => group.id), ["overview", "testing", "insights"]);
  }
});

test("imports highlights cases and active rare routes stay available in overflow", () => {
  assert.equal(navigation("imports").activeId, "cases");
  const result = navigation("api");
  assert.equal(result.activeId, "api"); assert.deepEqual(result.visibleIds, core);
  assert.ok(result.hiddenIds.includes("api"));
});

test("only explicit available pins promote rare services into the rail", () => {
  const result = navigation("custom-fields", ["hooks", "api", "hooks", "portfolios"], ["cases", "hooks", "portfolios", "custom-fields"]);
  assert.deepEqual(result.pinnedIds, ["portfolios", "hooks"]);
  assert.deepEqual(result.visibleIds, ["cases", "portfolios", "hooks"]);
  assert.deepEqual(result.hiddenIds, ["custom-fields"]);
  assert.equal(result.activeId, "custom-fields");
});

test("capability filtering never infers grants from active routes or pins", () => {
  const result = navigation("api", ["api", "hooks"], ["cases", "hooks"]);
  assert.deepEqual(result.availableIds, ["cases", "hooks"]);
  assert.deepEqual(result.visibleIds, ["cases", "hooks"]); assert.equal(result.activeId, null);
});

test("utility routes retain primary navigation and an empty capability set has no links", () => {
  assert.deepEqual(navigation("config").visibleIds, core);
  assert.equal(navigation("config").activeId, null);
  assert.deepEqual(navigation("reports", [], []).groups, []);
});

test("Product Docs is a primary sidebar entry only in an enabled project", () => {
  assert.equal(navigation("product-docs").activeId, null);
  const enabled = navigation("product-docs", [], SIDEBAR_NAVIGATION_IDS);
  assert.equal(enabled.activeId, "product-docs");
  assert.deepEqual(enabled.visibleIds, ["dashboard", "cases", "product-docs", "shared-steps", "runs", "suites", "reports"]);
});
