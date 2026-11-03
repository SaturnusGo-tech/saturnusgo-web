import assert from "node:assert/strict";
import { test } from "node:test";
import { act } from "react-test-renderer";
import { fixture, folder } from "./structure-harness";

test("the architecture screen exposes every active folder including empty descendants and opens a root draft", t => {
  const f = fixture(t);
  assert.equal(f.root.root.findByType("h1").children.join(""), "Folder structure");
  const rows = f.root.root.findAll(node => node.props["data-structure-folder"]);
  assert.deepEqual(rows.map(row => row.props["data-structure-folder"]).sort(), ["api", "auth", "empty"]);
  assert.equal(f.root.root.findByProps({ "aria-label": "Collapse API" }).props["aria-expanded"], true);
  assert.equal(f.root.root.findAllByType("form").length, 1);
  assert.equal(f.root.root.findAll(node => node.props.role === "dialog").length, 0);
});

test("confirmed root and child saves stay on the screen and do not require a completed list refresh", async t => {
  const f = fixture(t);
  f.name("  Root QA  "); await f.submit();
  assert.deepEqual(f.calls, [{ name: "Root QA", parentId: null }]);
  assert.ok(f.root.root.findAll(node => node.props["data-structure-folder"] === "created-1").length);
  assert.equal(f.back(), 0);
  act(() => f.buttons("Add subfolder to /API")[0].props.onClick());
  f.name("Child QA"); await f.submit();
  assert.deepEqual(f.calls[1], { name: "Child QA", parentId: "api" });
  assert.ok(f.root.root.findAll(node => node.props["data-structure-folder"] === "created-2").length);
  assert.equal(f.back(), 0);
});

test("manual branch collapse survives resource refresh and a child draft reopens its parent", t => {
  const f = fixture(t);
  act(() => f.buttons("Collapse API")[0].props.onClick());
  assert.equal(f.root.root.findByProps({ "aria-label": "Expand API" }).props["aria-expanded"], false);
  f.update({ items: [...f.resource.items, folder("later", "Later")] });
  assert.equal(f.root.root.findByProps({ "aria-label": "Expand API" }).props["aria-expanded"], false);
  act(() => f.buttons("Add subfolder to /API")[0].props.onClick());
  assert.equal(f.root.root.findByProps({ "aria-label": "Collapse API" }).props["aria-expanded"], true);
});

test("failed saves retain name and chosen parent for retry", async t => {
  const parents: (string | null)[] = [];
  const f = fixture(t, { create: async (name, parentId) => { parents.push(parentId); return parents.length === 1 ? null : folder("saved", name, parentId); } });
  act(() => f.buttons("Add subfolder to /API")[0].props.onClick());
  f.name("Retained"); await f.submit();
  assert.equal(f.root.root.findByProps({ "aria-label": "Folder name" }).props.value, "Retained");
  assert.equal(f.root.root.findAll(node => typeof node.type === "function" && node.type.name === "ParentFolderPicker").length, 0);
  assert.ok(f.root.root.findAll(node => node.props.role === "alert").length);
  await f.submit(); assert.deepEqual(parents, ["api", "api"]);
});

test("pending creation blocks page exit and competing creation actions", async t => {
  let release!: (value: ReturnType<typeof folder>) => void;
  const f = fixture(t, { create: () => new Promise(resolve => { release = resolve; }) });
  f.name("Pending"); const form = f.root.root.findByType("form");
  let completion!: Promise<void>;
  act(() => { completion = form.props.onSubmit({ preventDefault() {} }); });
  assert.equal(f.buttons("Back to repository")[0].props.disabled, true);
  assert.equal(f.buttons("New folder")[0].props.disabled, true);
  act(() => f.buttons("Back to repository")[0].props.onClick()); assert.equal(f.back(), 0);
  await act(async () => { release(folder("done", "Pending")); await completion; });
});

test("read-only structure remains browsable without a creation form", t => {
  const f = fixture(t, { canManage: false });
  assert.equal(f.root.root.findAllByType("form").length, 0);
  assert.equal(f.buttons("New folder")[0].props.disabled, true);
  assert.equal(f.buttons("Add subfolder to /API")[0].props.disabled, true);
  act(() => f.buttons("Back to repository")[0].props.onClick()); assert.equal(f.back(), 1);
});
