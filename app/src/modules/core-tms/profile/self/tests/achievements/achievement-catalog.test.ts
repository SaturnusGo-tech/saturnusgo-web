import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";
import { achievementCatalog, achievementPercent, achievementProgress } from "../../content/achievement-catalog";
import type { ProfileAchievement } from "../../domain/achievements/profile-achievement-model";

void test("the approved collection has exactly forty distinct bilingual stories and shipped assets", () => {
  assert.equal(achievementCatalog.length, 40);
  assert.equal(new Set(achievementCatalog.map(item => item.slug)).size, 40);
  assert.deepEqual(achievementCatalog.map(item => item.id), Array.from({ length: 40 }, (_, index) => index + 1));
  for (const item of achievementCatalog) {
    for (const key of ["nameRu", "nameEn", "conditionRu", "conditionEn", "storyRu", "storyEn", "valueRu", "valueEn"] as const) assert.ok(item[key].trim());
    assert.ok(existsSync(`public${item.image}`), `missing approved asset ${item.image}`);
  }
});
void test("earned order and progress come only from matching server identities", () => {
  const progress: ProfileAchievement = { id: 2, slug: "product-map", progress: 25, target: 25, status: "earned", earnedAt: "2026-11-05T00:00:00Z", evidenceCount: 25, tracking: "available" };
  const result = achievementProgress(achievementCatalog, { catalogVersion: 1, items: [progress, { ...progress, id: 99, slug: "first-scenario" }] });
  assert.equal(result[0].story.id, 2);
  assert.equal(result.find(item => item.story.id === 1)?.progress, undefined);
  assert.equal(achievementProgress(achievementCatalog, null).filter(item => item.progress).length, 0);
  assert.equal(achievementPercent(progress), 100);
  assert.equal(achievementPercent({ ...progress, status: "locked", progress: 30 }), 100);
  assert.equal(achievementPercent({ ...progress, status: "locked", progress: -1 }), 0);
  assert.equal(achievementPercent(undefined), 0);
});
