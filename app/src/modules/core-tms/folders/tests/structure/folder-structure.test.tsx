import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import React from "react";
import { act, create } from "react-test-renderer";
import { fixture, folder } from "./structure-harness";
import { FolderAppearanceContext } from "../../state/appearance/folder-appearance-context";

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

const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const previousSelf = Object.getOwnPropertyDescriptor(globalThis, "self");
const stored = new Map<string, string>();
const storage = { getItem: (key: string) => stored.get(key) ?? null, setItem: (key: string, value: string) => { stored.set(key, value); } };
before(() => {
  const events = new EventTarget();
  const host = { localStorage: storage, addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events) };
  Object.defineProperty(globalThis, "window", { configurable: true, value: host });
  Object.defineProperty(globalThis, "self", { configurable: true, value: host });
});
after(() => {
  if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow); else Reflect.deleteProperty(globalThis, "window");
  if (previousSelf) Object.defineProperty(globalThis, "self", previousSelf); else Reflect.deleteProperty(globalThis, "self");
});
const editable = (projectId: string) => ({ items: [{ ...folder("api", "API"), projectId }], saveAppearance: async (value: ReturnType<typeof folder>) => value });
const tips = (f: ReturnType<typeof fixture>) => f.root.root.findAllByProps({ role: "note" });

test("the contextual appearance tip is shown once per project and remains during the first visit", t => {
  const f = fixture(t, editable("tip-first-visit"));
  assert.equal(tips(f).length, 1);
  assert.equal(stored.get("falcon:folder-appearance-tip:v1:w:tip-first-visit"), "seen", "the seen marker must survive a browser reload");
  f.update({ items: [...f.resource.items] });
  assert.equal(tips(f).length, 1, "a data refresh must not remove the readable tip");
  const returning = fixture(t, editable("tip-first-visit"));
  assert.equal(tips(returning).length, 0, "a second visit must respect the seen marker");
  const anotherProject = fixture(t, editable("tip-another-project"));
  assert.equal(tips(anotherProject).length, 1);
  stored.set("falcon:folder-appearance-tip:v1:w:tip-persisted", "seen");
  assert.equal(tips(fixture(t, editable("tip-persisted"))).length, 0, "a stored marker is respected before the project is seen in this session");
});

test("Got it and Escape dismiss the tip without blocking folder operations", t => {
  const f = fixture(t, editable("tip-dismiss"));
  act(() => f.buttons("Got it")[0].props.onClick());
  assert.equal(tips(f).length, 0);
  act(() => f.buttons("New folder")[0].props.onClick());
  assert.equal(f.root.root.findAllByType("form").length, 1);
  assert.equal(tips(fixture(t, editable("tip-dismiss"))).length, 0);
  const keyboard = fixture(t, editable("tip-keyboard"));
  let prevented = false;
  act(() => tips(keyboard)[0].props.onKeyDown({ key: "Escape", preventDefault() { prevented = true; }, stopPropagation() {} }));
  assert.equal(prevented, true);
  assert.equal(tips(keyboard).length, 0);
});

test("opening the actual folder icon removes the tip and prevents it on future visits", async t => {
  const f = fixture(t, editable("tip-icon"));
  assert.equal(tips(f).length, 1);
  await act(async () => { f.buttons("Folder appearance: API")[0].props.onClick({ stopPropagation() {} }); });
  assert.equal(tips(f).length, 0);
  assert.equal(f.buttons("Folder appearance: API")[0].props["aria-expanded"], true);
  assert.equal(tips(fixture(t, editable("tip-icon"))).length, 0);
});

test("an appearance icon opened before visiting structure already completes discovery", async t => {
  const { FolderAppearanceControl } = await import("../../presentation/appearance/control/FolderAppearanceControl");
  const resource = editable("tip-opened-elsewhere");
  let view!: ReturnType<typeof create>;
  act(() => { view = create(<FolderAppearanceContext.Provider value={{ folders: resource.items, save: resource.saveAppearance }}>
    <FolderAppearanceControl folder={resource.items[0]} ru={false} editable />
  </FolderAppearanceContext.Provider>); });
  t.after(() => act(() => view.unmount()));
  await act(async () => { view.root.findByType("button").props.onClick({ stopPropagation() {} }); });
  assert.equal(tips(fixture(t, resource)).length, 0);
});

test("loading, errors, empty and read-only folders do not consume the appearance tip", t => {
  const f = fixture(t, { ...editable("tip-availability"), loading: true });
  assert.equal(tips(f).length, 0);
  f.update({ loading: false, error: "Offline" }); assert.equal(tips(f).length, 0);
  f.update({ error: "", canManage: false }); assert.equal(tips(f).length, 0);
  f.update({ canManage: true, saveAppearance: undefined }); assert.equal(tips(f).length, 0);
  f.update({ ...editable("tip-availability"), items: [] }); assert.equal(tips(f).length, 0);
  f.update(editable("tip-availability")); assert.equal(tips(f).length, 1);
});

test("restricted browser storage never breaks the page or repeats the tip during the session", t => {
  Object.defineProperty(window, "localStorage", { configurable: true, get() { throw new Error("Storage unavailable"); } });
  t.after(() => { Object.defineProperty(window, "localStorage", { configurable: true, value: storage }); });
  const f = fixture(t, editable("tip-restricted-storage"));
  assert.equal(tips(f).length, 1);
  act(() => f.buttons("Got it")[0].props.onClick());
  assert.equal(tips(fixture(t, editable("tip-restricted-storage"))).length, 0);
});

test("the appearance tip uses Russian labels when the repository locale is Russian", t => {
  const f = fixture(t, editable("tip-russian"), true);
  assert.equal(tips(f).length, 1);
  assert.equal(f.buttons("Понятно").length, 1);
  act(() => f.buttons("Закрыть подсказку")[0].props.onClick());
  assert.equal(tips(f).length, 0);
});
