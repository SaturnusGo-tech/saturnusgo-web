import assert from "node:assert/strict";
import test from "node:test";
import type { ComponentProps } from "react";
import type { BulkActionMenu } from "../BulkActionMenu";
import { bulkHarness, elements, harness } from "./bulk-harness";

const tick = () => new Promise<void>((resolve) => setImmediate(resolve));
test("bulk selection exposes move, run, unfile and archive directly with only status/priority in menus", () => {
  const app = bulkHarness();
  assert.equal(app.buttons().length, 5);
  assert.deepEqual(elements(app.render(), (item) => item.type === "BulkActionMenu").map((item) => item.props.id), ["bulk-lifecycle", "bulk-priority"]);
  for (const button of app.buttons()) (button.props.onClick as () => void)();
  assert.deepEqual(app.calls, ["move", "run", "remove", "archive", "clear"]);
});
test("status and priority menus invoke the existing mutations and close after selection", async () => {
  const app = bulkHarness();
  app.menu("bulk-priority").onToggle();
  assert.equal(app.menu("bulk-priority").open, true); assert.equal(app.menu().open, false);
  app.menu("bulk-priority").onSelect("critical"); await tick();
  app.menu().onToggle(); app.menu().onSelect("ready"); await tick();
  assert.deepEqual(app.calls, ["priority:critical", "lifecycle:ready"]);
  assert.equal(app.menu().open, false); assert.equal(app.menu("bulk-priority").open, false);
});
test("a rejected bulk update retains selection, disables concurrent actions and exposes a retryable error", async () => {
  const message = "Conflict in selected cases. Refresh their versions before retrying.";
  const app = bulkHarness({ onChangePriority: async () => ({ ok: false, message }) });
  app.menu("bulk-priority").onToggle(); app.menu("bulk-priority").onSelect("high");
  assert.equal(app.menu().disabled, true); assert.ok(app.buttons().every((button) => button.props.disabled));
  await tick();
  assert.equal(app.props.selectedCount, 83); assert.deepEqual(app.calls, []);
  assert.equal(elements(app.render(), (item) => item.props.role === "alert")[0].props.children, message);
  assert.equal(app.menu("bulk-priority").disabled, false);
});
test("permissions, mutation limits and folder activity preserve their separate restrictions", () => {
  const app = bulkHarness({ selectedCount: 1001, onMove: undefined, onRemove: undefined, onArchive: undefined });
  assert.equal(app.buttons().length, 2, "run and clear remain available without folder-management callbacks");
  assert.equal(app.menu().disabled, true); assert.equal(app.menu("bulk-priority").disabled, true);
  assert.ok(app.buttons().every((button) => !button.props.disabled));
  app.props.externalBusy = true;
  assert.ok(app.buttons().every((button) => button.props.disabled));
  assert.equal(app.menu().disabled, true); assert.deepEqual(app.calls, []);
});

test("Menu keyboard navigation skips disabled actions, returns focus on Escape and keeps Tab untrapped", () => {
  const calls: string[] = [];
  const props: ComponentProps<typeof BulkActionMenu<string>> = {
    id: "test", label: "More actions", compactLabel: "More", open: true, disabled: false,
    options: [{ value: "run", label: "Run", icon: null }, { value: "priority", label: "Priority", icon: null, disabled: true }, { value: "archive", label: "Archive", icon: null }],
    icon: null, onToggle() {}, onClose: () => calls.push("close"), onSelect: (value) => calls.push(value),
  };
  const app = harness("../BulkActionMenu.tsx", "BulkActionMenu", props);
  const root = app.render() as { props: { onKeyDown: (event: { key: string; preventDefault: () => void }) => void } };
  const available = ["run", "archive"].map((name) => ({ focus() { app.document.activeElement = this; calls.push(name); } }));
  app.refs[0].current = { querySelector: () => available[0], querySelectorAll: (selector: string) => {
    assert.equal(selector, "button:not(:disabled)"); return available;
  } };
  app.refs[1].current = { focus: () => calls.push("trigger") };
  app.flushEffects();
  root.props.onKeyDown({ key: "ArrowDown", preventDefault() {} });
  assert.deepEqual(calls, ["run", "archive"]);
  root.props.onKeyDown({ key: "Escape", preventDefault: () => calls.push("prevent") });
  assert.deepEqual(calls.slice(-3), ["prevent", "close", "trigger"]);
  root.props.onKeyDown({ key: "Tab", preventDefault: () => assert.fail("Tab must leave the menu") });
  assert.deepEqual(calls.slice(-2), ["trigger", "close"]);
  const disabledItem = elements(app.render(), (item) => item.props.role === "menuitem" && Boolean(item.props.disabled))[0];
  (disabledItem.props.onClick as () => void)(); assert.ok(!calls.includes("priority"));
});
