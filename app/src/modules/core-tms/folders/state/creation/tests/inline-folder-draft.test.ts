import assert from "node:assert/strict";
import test from "node:test";
import { hookHarness } from "../../../../state/navigation/browser/tests/project/hook-harness";
import type { RepositoryCreation } from "../../../model/creation/repository-creation";
import type { RepositoryFolder } from "../../../model/folder";
import type { useInlineFolderDraft } from "../useInlineFolderDraft";

function setup() {
  const h = hookHarness("https://falcon.test/");
  const writes: { name: string; parent: string | null; resolve: (folder: RepositoryFolder | null) => void }[] = [];
  const created: RepositoryFolder[] = []; let closed = 0; let disabled = false;
  const creation: RepositoryCreation = { activeFolderId: "parent", begin() {}, close() { closed++; },
    create: (name, parent) => new Promise(resolve => writes.push({ name, parent, resolve })),
    created: folder => created.push(folder), createCase() {} };
  const hook = h.load<{ useInlineFolderDraft: typeof useInlineFolderDraft }>(new URL("../useInlineFolderDraft.ts", import.meta.url), name => { throw new Error(name); }).useInlineFolderDraft;
  return { writes, created, creation, closed: () => closed, disable: () => { disabled = true; },
    render: () => h.settle(() => hook("parent", creation, disabled, true)), dispose: h.dispose };
}
const folder = { id: "new", parentId: "parent", name: "Проверки", path: "/API/Проверки" } as RepositoryFolder;

test("inline save targets the clicked parent, trims whitespace and prevents a second concurrent request", async () => {
  const app = setup(); app.render().setName("  Проверки  ");
  const draft = app.render(); const first = draft.save(); const second = draft.save();
  assert.equal(app.writes.length, 1); assert.equal(app.writes[0].parent, "parent"); assert.equal(app.writes[0].name, "Проверки");
  app.render().cancel(); assert.equal(app.closed(), 0, "pending writes cannot be dismissed and retried blindly");
  app.writes[0].resolve(folder); assert.equal(await first, true); assert.equal(await second, false);
  assert.deepEqual(app.created, [folder]); assert.equal(app.render().saving, false); app.dispose();
});

test("empty names and disabled authoring never issue writes", async () => {
  const app = setup(); app.render().setName("   "); assert.equal(await app.render().save(), false);
  app.render().setName("Проверки"); app.disable(); assert.equal(await app.render().save(), false);
  assert.equal(app.writes.length, 0); app.dispose();
});

test("server rejection retains the draft for correction and retry", async () => {
  const app = setup(); app.render().setName("Проверки"); const attempt = app.render().save();
  app.writes[0].resolve(null); assert.equal(await attempt, false);
  assert.equal(app.render().name, "Проверки"); assert.ok(app.render().error); assert.equal(app.created.length, 0);
  const retry = app.render().save(); app.writes[1].resolve(folder); assert.equal(await retry, true);
  assert.equal(app.render().error, ""); app.dispose();
});

test("a response after navigation cannot select a folder in the next screen", async () => {
  const app = setup(); app.render().setName("Проверки"); const attempt = app.render().save(); app.dispose();
  app.writes[0].resolve(folder); assert.equal(await attempt, false); assert.equal(app.created.length, 0);
});

test("cancel is explicit and does not create an empty folder", () => {
  const app = setup(); app.render().setName("Черновик"); app.render().cancel();
  assert.equal(app.closed(), 1); assert.equal(app.writes.length, 0); app.dispose();
});
