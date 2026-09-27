import assert from "node:assert/strict";
import { test } from "node:test";
import { getSidebarNavigation, SIDEBAR_NAVIGATION_IDS } from "../../model/sidebar-navigation";
import type { View } from "../../../../state/types/workspace";

const full = { mode: "all", pinned: [] } as const;
const contextual = { mode: "contextual", pinned: [] } as const;
const navigation = (activeView: View, availableIds: readonly View[] = SIDEBAR_NAVIGATION_IDS, preferences = contextual) =>
  getSidebarNavigation({ activeView, availableIds, preferences });

test("full mode preserves the four groups and canonical order despite caller order", () => {
  const result = getSidebarNavigation({ activeView: "cases", availableIds: [...SIDEBAR_NAVIGATION_IDS].reverse(), preferences: full });
  assert.deepEqual(result.visibleIds, SIDEBAR_NAVIGATION_IDS);
  assert.deepEqual(result.groups.map(group => group.id), ["overview", "testing", "management", "insights"]);
  assert.deepEqual(result.hiddenIds, []);
});

test("imports selects cases and keeps its entire testing group in contextual mode", () => {
  const result = navigation("imports");
  assert.equal(result.activeId, "cases");
  assert.deepEqual(result.visibleIds, ["dashboard", "cases", "shared-steps", "runs", "suites", "reports"]);
  assert.deepEqual(result.hiddenIds, ["portfolios", "custom-fields", "api", "hooks"]);
});

test("contextual management includes its context and the available core, never inferred grants", () => {
  const result = navigation("custom-fields", ["custom-fields", "cases", "hooks", "help", "imports"]);
  assert.deepEqual(result.visibleIds, ["cases", "custom-fields", "hooks"]);
  assert.deepEqual(result.availableIds, ["cases", "custom-fields", "hooks"]);
  assert.deepEqual(result.groups.map(group => group.id), ["testing", "management"]);
});

test("pins use canonical order and unavailable pinned or active views never become links", () => {
  const preferences = { mode: "contextual", pinned: ["hooks", "api", "hooks", "portfolios"] } as const;
  const result = getSidebarNavigation({ activeView: "api", availableIds: ["cases", "hooks", "portfolios"], preferences });
  assert.deepEqual(result.pinnedIds, ["portfolios", "hooks"]);
  assert.deepEqual(result.visibleIds, ["cases", "portfolios", "hooks"]);
  assert.equal(result.activeId, null);
  assert.deepEqual(preferences.pinned, ["hooks", "api", "hooks", "portfolios"]);
});

test("utility routes leave the core visible and every other permitted section discoverable", () => {
  const result = navigation("config");
  assert.equal(result.activeId, null);
  assert.deepEqual(result.visibleIds, ["dashboard", "cases", "runs", "reports"]);
  assert.deepEqual(result.hiddenIds, ["shared-steps", "suites", "portfolios", "custom-fields", "api", "hooks"]);
  assert.deepEqual(navigation("reports", []).groups, []);
});
