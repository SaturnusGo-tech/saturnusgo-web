import assert from "node:assert/strict";
import test from "node:test";
import { setImmediate } from "node:timers/promises";
import { TmsApiError } from "../../../../../../core/tms/transport/http";
import { folder, folderHarness } from "./folder-harness";

test("a write finishing after a project switch cannot navigate its old dialog", async () => {
  const h = folderHarness();
  const created = h.render().create("A", null);
  h.derived.project.id = "project-b"; h.render();
  h.writes[0].resolve({ data: folder });
  assert.equal(await created, null);
  assert.equal(h.refreshes.length, 0);
  assert.equal(h.reloads(), 0);
});

test("workspace identity also invalidates a late folder result", async () => {
  const h = folderHarness();
  const created = h.render().create("A", null);
  h.state.data.workspace.id = "workspace-b"; h.render();
  h.writes[0].resolve({ data: folder });
  assert.equal(await created, null);
  assert.equal(h.refreshes.length, 0);
});

test("pending navigation suppresses new commands and successful old writes", async () => {
  const h = folderHarness();
  const resource = h.render();
  const first = resource.create("A", null);
  const navigation = h.requests.beginNavigation();
  h.writes[0].resolve({ data: folder });
  assert.equal(await first, null);
  assert.equal(await resource.create("B", null), null);
  assert.equal(h.writes.length, 1);
  navigation.finish();
});

test("navigation during refresh cannot return success or a stale refresh warning", async () => {
  const h = folderHarness();
  const created = h.render().create("A", null);
  h.writes[0].resolve({ data: folder });
  await setImmediate();
  assert.equal(h.refreshes.length, 1);
  h.requests.beginNavigation();
  h.refreshes[0].resolve(null);
  assert.equal(await created, null);
  assert.equal(h.render().error, "");
});

test("unmount and leaving the repository suppress pending completion", async () => {
  for (const leave of ["unmount", "view"]) {
    const h = folderHarness();
    const created = h.render().create("A", null);
    if (leave === "unmount") h.unmount(); else { h.state.view = "dashboard"; h.render(); }
    h.writes[0].resolve({ data: folder });
    assert.equal(await created, null);
    assert.equal(h.refreshes.length, 0);
  }
});

test("an unconfirmed retry keeps its key while a confirmed write tolerates refresh failure", async () => {
  const h = folderHarness();
  const first = h.render().create("A", null);
  h.writes[0].reject(new Error("connection lost"));
  assert.equal(await first, null);
  const retry = h.render().create("A", null);
  assert.equal(h.writes[1].key, h.writes[0].key);
  h.writes[1].resolve({ data: folder });
  await setImmediate();
  h.refreshes[0].resolve(null);
  assert.equal(await retry, folder);
  assert.match(h.render().error, /Changes saved/);
});

test("a 412 refreshes folders and case ETags without replaying the write", async () => {
  const h = folderHarness();
  h.derived.projectCases = [{ id: "case-a", etag: '"case-a:1"' }];
  const first = h.render().moveCases(["case-a"], "folder-b");
  h.writes[0].reject(new TmsApiError("Version changed", 412, null));
  await setImmediate();
  assert.equal(h.reloads(), 1);
  assert.equal(h.refreshes.length, 1);
  assert.equal(h.writes.length, 1);
  h.derived.projectCases = [{ id: "case-a", etag: '"case-a:2"' }];
  h.refreshes[0].resolve({ testCases: h.derived.projectCases });
  assert.equal((await first).ok, false);
  assert.equal(h.writes.length, 1);
  const retry = h.render().moveCases(["case-a"], "folder-b");
  assert.equal(JSON.stringify(h.writes[1].args[2]), JSON.stringify({ items: [{ id: "case-a", ifMatch: '"case-a:2"' }], targetFolderId: "folder-b" }));
  assert.notEqual(h.writes[1].key, h.writes[0].key);
  h.writes[1].resolve({ data: {} });
  await setImmediate();
  h.refreshes[1].resolve({});
  assert.equal((await retry).ok, true);
});

test("manual reload refreshes both resources for read-only users and retains a failed-refresh warning", async () => {
  const h = folderHarness();
  h.state.data.meta.authorization.capabilities = [];
  const reload = h.render().reload();
  assert.equal(h.reloads(), 1);
  assert.equal(h.refreshes.length, 1);
  h.refreshes[0].resolve(null);
  await reload;
  assert.match(h.render().error, /Could not refresh cases/);
  const retry = h.render().reload();
  h.refreshes[1].resolve({});
  await retry;
  assert.equal(h.render().error, "");
  assert.equal(h.writes.length, 0);
});

test("manual reload cannot start from an old scope or overwrite a new scope after navigation", async () => {
  const h = folderHarness();
  const old = h.render();
  h.state.data.workspace.id = "workspace-b"; h.render();
  await old.reload();
  assert.equal(h.refreshes.length, 0);
  const reload = h.render().reload();
  h.requests.beginNavigation();
  h.refreshes[0].resolve(null);
  await reload;
  assert.equal(h.render().error, "");
  await h.render().reload();
  assert.equal(h.refreshes.length, 1);
});

test("a late 412 cannot refresh the destination project", async () => {
  const h = folderHarness();
  const first = h.render().create("A", null);
  h.derived.project.id = "project-b"; h.render();
  h.writes[0].reject(new TmsApiError("Version changed", 412, null));
  await first;
  assert.equal(h.refreshes.length, 0);
  assert.equal(h.reloads(), 0);
  assert.equal(h.render().error, "");
});

test("a confirmed folder edit appears before refresh completes and never reconciles into another project", async () => {
  const h = folderHarness();
  const updated = { ...folder, name: "Renamed", path: "/Renamed", rowVersion: 2, etag: '"folder-a:2"' };
  const save = h.render().update(folder, { name: updated.name });
  h.writes[0].resolve({ data: updated });
  await setImmediate();
  assert.deepEqual(h.reconciled, [updated]);
  assert.equal(h.refreshes.length, 1);
  h.refreshes[0].resolve({});
  assert.equal(await save, true);

  const late = h.render().update(updated, { name: "Other" });
  h.derived.project.id = "project-b"; h.render();
  h.writes[1].resolve({ data: { ...updated, name: "Other", rowVersion: 3 } });
  assert.equal(await late, false);
  assert.deepEqual(h.reconciled, [updated]);
});
