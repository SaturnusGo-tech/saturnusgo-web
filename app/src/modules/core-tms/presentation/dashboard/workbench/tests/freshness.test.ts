import assert from "node:assert/strict";
import test from "node:test";
import type { WorkbenchSnapshot } from "../../../../dashboards/workbench/model/workbench";
import { freshnessPages, normalizeFreshnessPage, pageForKey } from "../freshness/model";

test("freshness preserves seven distinct live drill metrics without summing overlapping counts", () => {
  const snapshot = {
    counts: { activeRuns: 2, readyForRetest: 7, blockedActiveItems: 3, openDefects: 22 },
    freshness: { notRunActiveItems: 5, inProgressActiveItems: 1, outdatedActiveItems: 4, activeRunsWithoutBuild: 0 },
  } as WorkbenchSnapshot;
  const pages = freshnessPages(snapshot);
  assert.deepEqual(pages.map((page) => page.map(({ kind, count }) => [kind, count])), [
    [["notRunItems", 5], ["inProgressItems", 1], ["outdatedItems", 4], ["runsWithoutBuild", 0]],
    [["activeRuns", 2], ["blockedItems", 3], ["openDefects", 22]],
  ]);
  assert.equal(new Set(pages.flat().map(({ kind }) => kind)).size, 7);
});

test("missing snapshot remains unavailable while authoritative zero stays available", () => {
  assert.equal(freshnessPages(null).flat().every(({ count }) => count === undefined), true);
  const snapshot = { counts: { activeRuns: 0, blockedActiveItems: 0, openDefects: 0 },
    freshness: { notRunActiveItems: 0, inProgressActiveItems: 0, outdatedActiveItems: 0, activeRunsWithoutBuild: 0 } } as WorkbenchSnapshot;
  assert.equal(freshnessPages(snapshot).flat().every(({ count }) => count === 0), true);
});

test("persisted page is normalized and keyboard navigation stays inside two pages", () => {
  for (const value of [-Infinity, Infinity, NaN, -4, 0, .7]) assert.equal(normalizeFreshnessPage(value), 0);
  for (const value of [1, 1.8, 99]) assert.equal(normalizeFreshnessPage(value), 1);
  assert.equal(pageForKey(0, "ArrowRight"), 1);
  assert.equal(pageForKey(1, "ArrowLeft"), 0);
  assert.equal(pageForKey(0, "ArrowLeft"), 0);
  assert.equal(pageForKey(1, "ArrowRight"), 1);
  assert.equal(pageForKey(0, "End"), 1);
  assert.equal(pageForKey(1, "Home"), 0);
  assert.equal(pageForKey(0, "Tab"), undefined);
});
