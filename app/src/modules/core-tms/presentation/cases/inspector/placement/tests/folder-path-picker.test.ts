import assert from "node:assert/strict";
import test from "node:test";
import type { FolderPathPicker } from "../FolderPathPicker";
import { componentHarness, invoke, nodes, type Node } from "../../../../../portfolios/tests/support/component-harness";

function picker() {
  const document = { activeElement: null as unknown };
  const h = componentHarness(undefined, { document });
  const { FolderPathPicker: renderPicker } = h.load<{ FolderPathPicker: typeof FolderPathPicker }>(
    new URL("../FolderPathPicker.tsx", import.meta.url), name => name.endsWith("useAnchoredPopup") ? { useAnchoredPopup() {} } : undefined);
  const changes: string[] = []; let focused = 0;
  const props = { value: "/Mobile", folders: ["/Mobile", "/Mobile/Android", "/Web"], ru: false, disabled: false,
    onChange: (value: string) => { changes.push(value); props.value = value; } };
  const render = () => nodes(h.render(() => renderPicker(props)));
  const trigger = () => render().find(node => node.props["aria-haspopup"] === "dialog")!;
  const open = () => { (trigger().props.ref as { current: unknown }).current = { focus() { focused++; } }; invoke(trigger(), "onClick"); };
  const input = () => render().find(node => node.type === "input")!;
  const type = (value: string) => invoke(input(), "onChange", { target: { value } });
  const root = () => render()[0];
  return { props, render, open, input, type, changes, trigger, root, document, focused: () => focused };
}
function key(key: string) {
  let prevented = false, stopped = false;
  return { key, preventDefault() { prevented = true; }, stopPropagation() { stopped = true; },
    prevented: () => prevented, stopped: () => stopped };
}

test("a new folder path is staged by an explicit inline action without changing the case while typing", () => {
  const h = picker(); h.open(); h.type("Mobile/iOS/Release");
  assert.deepEqual(h.changes, []);
  const create = h.render().find(node => node.props["data-folder-create"]);
  assert.ok(create, "unknown paths need an inline action, not an empty dead end");
  invoke(create, "onClick");
  assert.deepEqual(h.changes, ["/Mobile/iOS/Release"]);
  assert.equal(h.trigger().props["aria-expanded"], false);
  assert.equal(h.focused(), 1);
});

test("existing paths are selected once and the root remains a reachable destination", () => {
  const h = picker(); h.open();
  const root = h.render().find(node => node.props["data-folder-path"] === "/");
  assert.ok(root, "moving to the root was possible with the original free input");
  invoke(root, "onClick"); assert.deepEqual(h.changes, ["/"]);
  h.open(); h.type("/Web");
  assert.equal(h.render().some(node => node.props["data-folder-create"]), false);
  const existing = h.render().find(node => node.props["data-folder-path"] === "/Web");
  assert.ok(existing); invoke(existing, "onClick"); assert.deepEqual(h.changes, ["/", "/Web"]);
});

test("Enter commits a new path without submitting the case and Escape cancels with focus restored", () => {
  const h = picker(); h.open(); h.type("/New release");
  const enter = key("Enter"); invoke(h.input(), "onKeyDown", enter);
  assert.equal(enter.prevented(), true); assert.deepEqual(h.changes, ["/New release"]);
  h.open(); h.type("/Discard me"); const escape = key("Escape"); invoke(h.root(), "onKeyDown", escape);
  assert.equal(escape.prevented(), true); assert.equal(escape.stopped(), true);
  assert.deepEqual(h.changes, ["/New release"]); assert.equal(h.trigger().props["aria-expanded"], false);
});

test("arrow keys reach folder choices and creation from the search input", () => {
  const h = picker(); h.open(); h.type("/New release");
  let focus = "";
  const choices = ["first", "create"].map(id => ({ focus() { focus = id; h.document.activeElement = this; } }));
  const panel = h.render().find(node => node.props.role === "dialog") as Node;
  (panel.props.ref as { current: unknown }).current = { querySelectorAll: () => choices };
  const down = key("ArrowDown"); invoke(h.root(), "onKeyDown", down);
  assert.equal(focus, "first"); assert.equal(down.prevented(), true);
  invoke(h.root(), "onKeyDown", key("ArrowDown")); assert.equal(focus, "create");
  invoke(h.root(), "onKeyDown", key("ArrowUp")); assert.equal(focus, "first");
});

test("Enter on a partial search focuses a match instead of creating an unintended folder", () => {
  const h = picker(); h.open(); h.type("Mob");
  let focused = false;
  const panel = h.render().find(node => node.props.role === "dialog") as Node;
  (panel.props.ref as { current: unknown }).current = { querySelectorAll: () => [{ focus() { focused = true; } }] };
  const enter = key("Enter"); invoke(h.input(), "onKeyDown", enter);
  assert.equal(enter.prevented(), true); assert.equal(focused, true); assert.deepEqual(h.changes, []);
});

test("submitting closes access to the picker without changing the staged path", () => {
  const h = picker(); h.open(); h.type("/New release"); h.props.disabled = true;
  assert.equal(h.trigger().props.disabled, true);
  assert.equal(h.trigger().props["aria-expanded"], false);
  assert.equal(h.render().some(node => node.props.role === "dialog"), false);
  assert.deepEqual(h.changes, []);
});
