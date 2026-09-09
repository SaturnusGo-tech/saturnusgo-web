import assert from "node:assert/strict";
import test from "node:test";
import { repositoryWidth, REPOSITORY_MAX, REPOSITORY_MIN } from "../useRepositoryWidth";

test("repository expansion reserves at least 420px for cases on every supported desktop width", () => {
  for (const available of [660, 680, 760, 980, 1280, 1920]) {
    for (const desired of [160, 240, 304, 480, 620, 1400]) {
      const width = repositoryWidth(desired, available);
      assert.ok(width >= REPOSITORY_MIN); assert.ok(width <= REPOSITORY_MAX);
      assert.ok(available - width >= 420, `${desired}px at ${available}px must leave readable cases`);
    }
  }
});
test("a saved wide preference can return when the workspace grows after a temporary contraction", () => {
  const preferred = 600;
  assert.equal(repositoryWidth(preferred, 800), 380);
  assert.equal(repositoryWidth(preferred, 1200), preferred);
  assert.equal(repositoryWidth(10_000, 1800), REPOSITORY_MAX);
});
