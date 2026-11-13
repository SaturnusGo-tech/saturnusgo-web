import assert from "node:assert/strict";
import test from "node:test";
import { createReadingFixture } from "../../docs-reading-fixture";
import { readingRoles } from "../../fixtures/reading-access";

test("all five fixture roles receive server-shaped capabilities and publication-only ordinary reads", async () => {
  for (const role of readingRoles) {
    const f = createReadingFixture(false, role), page = await f.api.get(f.scope, "calendar");
    assert.equal(page.title, "Host calendar"); assert.ok(!JSON.stringify(page).includes("PRIVATE_DRAFT_ONLY"));
    assert.equal(page.draftVersion, 2); assert.equal(page.lifecycleVersion, 3);
    assert.equal(page.canArchive, true); assert.equal(page.canDelete, role === "workspace_admin" || role === "qa_manager");
    const list = await f.api.list(f.scope);
    assert.equal(list.canArchive, true); assert.equal(list.canDelete, page.canDelete);
    assert.ok(!list.nodes.some(node => node.id === "untitled-root"));
    if (["reporter", "viewer"].includes(role)) {
      await assert.rejects(f.api.get(f.scope, "calendar", { draft: true }), { code: "PRODUCT_DOC_ACCESS_DENIED" });
      await assert.rejects(f.api.get(f.scope, "untitled"), { code: "PRODUCT_DOC_NOT_FOUND" });
    } else assert.ok((await f.api.get(f.scope, "calendar", { draft: true })).sections.some(section => section.id === "private"));
    assert.deepEqual(f.writes, []);
  }
});

test("history resolves exact publication versions and never aliases private draft or current latest", async () => {
  const f = createReadingFixture(false, "viewer");
  const one = await f.api.get(f.scope, "calendar", { version: 1, draft: true });
  const two = await f.api.get(f.scope, "calendar", { version: 2 });
  assert.equal(one.version, 1); assert.equal(one.sections[0].id, "history");
  assert.equal(two.version, 2); assert.equal(two.sections[0].id, "intro");
  for (const page of [one, two]) {
    assert.equal(page.canEdit, false); assert.equal(page.canPublish, false);
    assert.equal(page.canArchive, false); assert.equal(page.canDelete, false);
    assert.ok(!JSON.stringify(page).includes("PRIVATE"));
  }
  await assert.rejects(f.api.get(f.scope, "calendar", { version: 99 }), { code: "PRODUCT_DOC_NOT_FOUND" });
});

test("fixture reads enforce exact local scope and abort without making network requests", async () => {
  const f = createReadingFixture(false), controller = new AbortController(); controller.abort();
  await assert.rejects(f.api.list(f.scope, { signal: controller.signal }), { name: "AbortError" });
  await assert.rejects(f.api.get({ ...f.scope, workspaceId: "other" }, "calendar"), { status: 404 });
  assert.deepEqual(f.writes, []);
});

test("archived reads reject the incompatible draft flag while archived-only metadata remains available", async () => {
  const f = createReadingFixture(false);
  await assert.rejects(f.api.get(f.scope, "archived-child", { draft: true, archived: true }), { status: 400, code: "VALIDATION_ERROR" });
  const page = await f.api.get(f.scope, "archived-child", { archived: true });
  assert.ok(page.archivedAt); assert.equal(page.canArchive, false); assert.equal(page.canDelete, true);
  assert.deepEqual(f.writes, []);
});
