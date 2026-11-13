import assert from "node:assert/strict";
import test from "node:test";
import type { FolderPathPicker } from "../FolderPathPicker";
import type { PropertyPopover, PropertySearch } from "../../../../common/properties/select/PropertySelect";
import { componentHarness, invoke, nodes } from "../../../../../portfolios/tests/support/component-harness";

function picker() {
  const h = componentHarness();
  const { FolderPathPicker: renderPicker } = h.load<{ FolderPathPicker: typeof FolderPathPicker }>(new URL("../FolderPathPicker.tsx", import.meta.url));
  const shared = componentHarness(undefined, { requestAnimationFrame: (callback: () => void) => callback() });
  const controls = shared.load<{ PropertyPopover: typeof PropertyPopover; PropertySearch: typeof PropertySearch }>(
    new URL("../../../../common/properties/select/PropertySelect.tsx", import.meta.url));
  const changes: string[] = []; let focused = 0;
  const props = { value: "/Mobile", folders: ["/Mobile", "/Mobile/Android", "/Web"], ru: false, disabled: false, allowCreate: true,
    onChange: (value: string) => { changes.push(value); props.value = value; } };
  const render = () => nodes(h.render(() => renderPicker(props)));
  const popover = () => {
    const node = render().find(node => node.type === "PropertyPopover");
    assert.ok(node, "folder choices must use the shared, portalled property popover"); return node;
  };
  const overlay = () => nodes(shared.render(() => controls.PropertyPopover(popover().props as Parameters<typeof PropertyPopover>[0])));
  const trigger = () => overlay().find(node => node.type === "Button")!;
  const open = () => invoke(popover(), "onOpenChange", true);
  const search = () => render().find(node => node.type === "PropertySearch")!;
  const type = (value: string) => invoke(search(), "onChange", value);
  const menuKey = (key: string, options: { focus(): void }[] = []) => {
    const event = keyboard(key, options);
    (trigger().props.ref as { current: unknown }).current = { focus() { focused++; } };
    invoke(overlay().find(node => node.type === "PopoverContent")!, "onKeyDownCapture", event); return event;
  };
  const searchKey = (key: string, options: { focus(): void }[]) => {
    const input = nodes(controls.PropertySearch(search().props as Parameters<typeof PropertySearch>[0])).find(node => node.type === "Input")!;
    const event = keyboard(key, options); invoke(input, "onKeyDown", event); return event;
  };
  return { props, render, open, search, type, changes, trigger, popover, overlay, menuKey, searchKey, focused: () => focused };
}
function keyboard(key: string, options: { focus(): void }[] = []) {
  let prevented = false, stopped = false;
  const list = { querySelectorAll: () => options, querySelector: () => options[0] };
  return { key, nativeEvent: { isComposing: false }, target: { tagName: "INPUT" }, currentTarget: { ...list, closest: () => list },
    preventDefault() { prevented = true; }, stopPropagation() { stopped = true; }, prevented: () => prevented, stopped: () => stopped };
}

test("typing stages nothing; the explicit create action normalizes and selects a new folder", () => {
  const h = picker(); h.open(); h.type("Mobile/iOS/Release");
  assert.deepEqual(h.changes, []);
  const create = h.render().find(node => node.props["data-folder-create"]); assert.ok(create);
  invoke(create, "onPress"); assert.deepEqual(h.changes, ["/Mobile/iOS/Release"]);
  assert.equal(h.popover().props.open, false);
});

test("existing paths are selected once and the root remains a reachable destination", () => {
  const h = picker(); h.open();
  const root = h.render().find(node => node.props["data-folder-path"] === "/"); assert.ok(root);
  invoke(root, "onPress"); assert.deepEqual(h.changes, ["/"]);
  h.open(); h.type("/Web"); assert.equal(h.render().some(node => node.props["data-folder-create"]), false);
  invoke(h.render().find(node => node.props["data-folder-path"] === "/Web")!, "onPress");
  assert.deepEqual(h.changes, ["/", "/Web"]);
});

test("Enter commits an exact new path without submitting the case; shared Escape cancels and restores focus", () => {
  const h = picker(); h.open(); h.type("/New release");
  const enter = h.menuKey("Enter"); assert.equal(enter.prevented(), true); assert.deepEqual(h.changes, ["/New release"]);
  h.open(); h.type("/Discard me"); const escape = h.menuKey("Escape");
  assert.equal(escape.prevented(), true); assert.equal(escape.stopped(), true);
  assert.deepEqual(h.changes, ["/New release"]); assert.equal(h.popover().props.open, false); assert.equal(h.focused(), 1);
});

test("the shared search transfers arrow navigation to the first or last available folder option", () => {
  const h = picker(); h.open(); h.type("Mobile"); let focus = "";
  const options = ["first", "last"].map(id => ({ focus() { focus = id; } }));
  assert.equal(h.searchKey("ArrowDown", options).prevented(), true); assert.equal(focus, "first");
  h.searchKey("ArrowUp", options); assert.equal(focus, "last"); assert.deepEqual(h.changes, []);
});

test("Enter on a partial search focuses a match instead of creating an unintended folder", () => {
  const h = picker(); h.open(); h.type("Mob"); let focused = false;
  const enter = h.menuKey("Enter", [{ focus() { focused = true; } }]);
  assert.equal(enter.prevented(), true); assert.equal(focused, true); assert.deepEqual(h.changes, []);
});

test("submitting closes and disables the picker, including option callbacks", () => {
  const h = picker(); h.open(); h.type("/New release");
  h.props.disabled = true;
  assert.equal(h.trigger().props.isDisabled, true);
  assert.equal(h.overlay().find(node => node.type === "Popover")!.props.isOpen, false);
  assert.equal(h.search().props.disabled, true);
  invoke(h.render().find(node => node.props["data-folder-path"] === "/")!, "onPress"); assert.deepEqual(h.changes, []);
});

test("long selected paths retain the complete accessible value while the visible label stays compact", () => {
  const h = picker(); const path = "/Web/My home/Tasks and assignees/Guest arrival preparation"; h.props.value = path;
  assert.equal(h.trigger().props["aria-label"], `Folder, ${path}`);
  assert.equal(h.overlay().find(node => node.type === "FolderPathBreadcrumb")?.props.path, path);
  h.open(); const selected = h.render().find(node => node.props["data-folder-path"] === path); assert.ok(selected);
  invoke(selected, "onPress"); assert.deepEqual(h.changes, [path]);
});

test("an existing-folder-only picker never creates an unknown folder from Enter or a menu action", () => {
  const h = picker(); h.props.allowCreate = false; h.open(); h.type("/Does not exist");
  assert.equal(h.render().some(node => node.props["data-folder-create"]), false);
  h.menuKey("Enter"); assert.deepEqual(h.changes, []);
  h.type("/Web"); h.menuKey("Enter"); assert.deepEqual(h.changes, ["/Web"]);
});

test("root destinations have a readable localized name without changing their stored path", () => {
  const h = picker(); h.props.value = "/";
  assert.equal(h.trigger().props["aria-label"], "Folder, Project root");
  const root = h.render().find(node => node.props["data-folder-path"] === "/")!;
  assert.equal(root.props.textValue, "Project root");
  assert.equal(root.props["aria-label"], "Project root");
  h.props.ru = true; assert.equal(h.trigger().props["aria-label"], "Папка, Корень проекта");
  invoke(root, "onPress"); assert.deepEqual(h.changes, ["/"]);
});
