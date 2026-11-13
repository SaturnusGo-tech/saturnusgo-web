import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { componentHarness, invoke, nodes } from "../../../../../../portfolios/tests/support/component-harness";
import type { StepActionMenu } from "../StepActionMenu";

function setup(t: TestContext, overrides: Partial<Parameters<typeof StepActionMenu>[0]> = {}) {
  const h = componentHarness(); t.after(() => h.dispose());
  const events: unknown[] = [];
  const loaded = h.load<{ StepActionMenu: typeof StepActionMenu }>(new URL("../StepActionMenu.tsx", import.meta.url));
  const render = () => nodes(h.render(() => loaded.StepActionMenu({ ru: false, sharedSteps: [], trigger: "start",
    onAdd: expected => events.push(expected), onInsertShared: id => events.push(id), ...overrides })));
  return { render, events };
}
test("beginning menu uses a stable portaled surface and can choose a shared procedure", t => {
  const h = setup(t), tree = h.render();
  const popover = tree.find(node => node.type === "Popover")!;
  assert.equal(popover.props.disableAnimation, true); assert.equal(popover.props.shouldBlockScroll, false);
  assert.ok(tree.some(node => node.type === "Button" && node.props["aria-label"] === "Insert at beginning"));
  invoke(popover, "onOpenChange", true);
  invoke(h.render().find(node => node.type === "Listbox")!, "onAction", "shared");
  invoke(h.render().find(node => node.type === "SharedStepChooser")!, "onSelect", "auth");
  assert.deepEqual(h.events, ["auth"]);
  assert.equal(h.render().find(node => node.type === "Popover")!.props.isOpen, false);
});
test("shared procedure editors never offer recursive shared procedures", t => {
  const h = setup(t, { allowSharedSteps: false });
  assert.ok(!h.render().some(node => node.type === "ListboxItem" && node.key === "shared"));
});
test("chooser opts out of scroll dismissal until a procedure is selected", t => {
  const h = setup(t);
  invoke(h.render().find(node => node.type === "Popover")!, "onOpenChange", true);
  invoke(h.render().find(node => node.type === "Listbox")!, "onAction", "shared");
  const choosing = h.render(), popover = choosing.find(node => node.type === "Popover")!;
  assert.equal(popover.props.shouldCloseOnScroll, false);
  assert.equal(popover.props.isOpen, true);
  assert.deepEqual(h.events, []);
  invoke(choosing.find(node => node.type === "SharedStepChooser")!, "onSelect", "procedure-146");
  assert.deepEqual(h.events, ["procedure-146"]);
  assert.equal(h.render().find(node => node.type === "Popover")!.props.isOpen, false);
});
test("ordinary actions close the menu and protected last steps cannot be deleted", t => {
  const h = setup(t, { onRemove() {}, canRemove: false });
  const list = h.render().find(node => node.type === "Listbox")!;
  assert.deepEqual(Array.from(list.props.disabledKeys as string[]), ["delete"]);
  invoke(list, "onAction", "expected"); assert.deepEqual(h.events, [true]);
  assert.equal(h.render().find(node => node.type === "Popover")!.props.isOpen, false);
});
