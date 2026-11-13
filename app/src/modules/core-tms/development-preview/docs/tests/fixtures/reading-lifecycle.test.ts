import assert from "node:assert/strict";
import test from "node:test";
import { createReadingFixture } from "../../docs-reading-fixture";

test("lower roles archive readable publications but cannot restore, delete or archive hidden drafts", async () => {
  for (const role of ["reporter", "viewer"] as const) {
    const f = createReadingFixture(false, role);
    await assert.rejects(f.api.setArchived(f.scope, "untitled", true, { expectedDraftVersion: 1 }), { code: "PRODUCT_DOC_NOT_FOUND" });
    const page = await f.api.get(f.scope, "calendar");
    await assert.rejects(f.api.setArchived(f.scope, page.id, true, { expectedDraftVersion: page.draftVersion }), { code: "PRODUCT_DOC_STALE_DRAFT" });
    const result = await f.api.setArchived(f.scope, page.id, true, { expectedDraftVersion: page.lifecycleVersion! });
    assert.equal(result.affectedCount, 2);
    await assert.rejects(f.api.get(f.scope, page.id), { code: "PRODUCT_DOC_NOT_FOUND" });
    await assert.rejects(f.api.setArchived(f.scope, page.id, false, { expectedDraftVersion: result.draftVersion }), { code: "PRODUCT_DOC_ACCESS_DENIED" });
    await assert.rejects(f.api.delete(f.scope, page.id, { expectedDraftVersion: result.draftVersion }, { idempotencyKey: "delete-lower" }), { code: "PRODUCT_DOC_ACCESS_DENIED" });
    const pinned = await f.api.get(f.scope, page.id, { version: 2 });
    assert.equal(pinned.title, "Host calendar"); assert.equal(pinned.canArchive, false);
    assert.deepEqual(f.writes, [{ action: "archive", id: "calendar" }]);
  }
});

test("folder archive preserves independent archive groups; delete tombstones every branch and replays without another mutation", async () => {
  const f = createReadingFixture(false), archived = await f.api.setArchived(f.scope, "section", true, { expectedDraftVersion: 1 });
  assert.equal(archived.affectedCount, 3);
  const restored = await f.api.setArchived(f.scope, "section", false, { expectedDraftVersion: archived.draftVersion });
  assert.equal(restored.affectedCount, 3);
  assert.ok((await f.api.get(f.scope, "archived-child", { archived: true })).archivedAt);
  const result = await f.api.delete(f.scope, "section", { expectedDraftVersion: restored.draftVersion }, { idempotencyKey: "delete-section" });
  assert.equal(result.affectedCount, 4);
  assert.deepEqual(await f.api.delete(f.scope, "section", { expectedDraftVersion: restored.draftVersion }, { idempotencyKey: "delete-section" }), result);
  await assert.rejects(f.api.delete(f.scope, "section", { expectedDraftVersion: 0 }, { idempotencyKey: "delete-section" }), { code: "IDEMPOTENCY_KEY_REUSED" });
  assert.ok(!(await f.api.list(f.scope, { archived: true })).nodes.some(node => ["section", "archived-child"].includes(node.id)));
  await assert.rejects(f.api.get(f.scope, "section-page", { draft: true }), { code: "PRODUCT_DOC_NOT_FOUND" });
  const history = await f.api.get(f.scope, "section-page", { version: 1 });
  assert.equal(history.version, 1); assert.equal(history.canDelete, false);
  assert.equal(f.writes.filter(write => write.action === "delete").length, 1);
});

test("OCC conflict leaves lifecycle unchanged; deleted current aliases fail while exact run pins stay readable", async () => {
  const f = createReadingFixture(false); f.injectConflict();
  await assert.rejects(f.api.delete(f.scope, "calendar", { expectedDraftVersion: 3 }, { idempotencyKey: "stale-delete" }), { code: "PRODUCT_DOC_STALE_DRAFT" });
  assert.deepEqual(f.writes, []);
  const page = await f.api.get(f.scope, "calendar");
  await f.api.delete(f.scope, page.id, { expectedDraftVersion: page.lifecycleVersion! }, { idempotencyKey: "delete-calendar" });
  for (const input of [{}, { draft: true }, { archived: true }]) await assert.rejects(f.api.get(f.scope, page.id, input), { code: "PRODUCT_DOC_NOT_FOUND" });
  const pins = await f.api.listRunRequirements(f.scope, "local-run", "local-item");
  assert.equal(pins.requirements[0].version, 1);
  assert.equal((await f.api.get(f.scope, page.id, { version: 1 })).sections[0].id, "history");
});
