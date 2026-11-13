import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes } from "../../../../../portfolios/tests/support/component-harness";
import type { PropertyPopover, PropertySelect } from "../PropertySelect";

test("scrolling may reposition property options without dismissing a pending choice", t => {
  const h = componentHarness(); t.after(() => h.dispose());
  const { PropertyPopover: Popover } = h.load<{ PropertyPopover: typeof PropertyPopover }>(new URL("../PropertySelect.tsx", import.meta.url));
  const changes: boolean[] = [];
  const tree = nodes(h.render(() => Popover({ label: "Section", trigger: "All sections", open: true,
    onOpenChange: value => changes.push(value), children: null })));
  const surface = tree.find(node => node.type === "Popover")!;
  assert.equal(surface.props.shouldCloseOnScroll, false);
  assert.equal(surface.props.shouldBlockScroll, false);
  assert.equal(surface.props.isOpen, true);
  assert.deepEqual(changes, []);
  invoke(surface, "onOpenChange", false);
  assert.deepEqual(changes, [false], "the library still owns outside-click dismissal");
});

test("an explicit property option commits once and closes the selection surface", t => {
  const h = componentHarness(); t.after(() => h.dispose());
  const { PropertySelect: Select } = h.load<{ PropertySelect: typeof PropertySelect }>(new URL("../PropertySelect.tsx", import.meta.url));
  const changes: string[] = [];
  const render = () => nodes(h.render(() => Select({ locale: "en", label: "Section", searchLabel: "Find a section",
    value: "all", options: [{ value: "all", label: "All sections" }, { value: "ios", label: "Host › iOS" }],
    onChange: value => changes.push(value) })));
  invoke(render()[0], "onOpenChange", true);
  assert.equal(render()[0].props.open, true);
  invoke(render().find(node => node.type === "ListboxItem" && node.key === "ios")!, "onPress");
  assert.deepEqual(changes, ["ios"]);
  assert.equal(render()[0].props.open, false);
});
