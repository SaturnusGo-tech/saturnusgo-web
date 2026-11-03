import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes } from "../../../../../../portfolios/tests/support/component-harness";
import type { FacetPicker } from "../FacetPicker";
test("facet selection supports multiple values without closing, and Escape returns focus", t => {
  const h = componentHarness(); t.after(() => h.dispose());
  const { FacetPicker: Picker } = h.load<{ FacetPicker: typeof FacetPicker }>(new URL("../FacetPicker.tsx", import.meta.url), name =>
    name.endsWith("useAnchoredPopup") ? { useAnchoredPopup() {} } : undefined);
  let selected = ["open"], focused = 0;
  const render = () => nodes(h.render(() => Picker({ label: "Status", allLabel: "All", selected,
    options: [{ value: "open", label: "Open", count: 4 }, { value: "closed", label: "Closed", count: 3 }],
    onToggle: value => { selected = selected.includes(value) ? selected.filter(item => item !== value) : [...selected, value]; } })));
  let tree = render(); const trigger = tree.find(n => n.type === "button")!;
  (trigger.props.ref as { current: unknown }).current = { focus: () => focused++ };
  invoke(trigger, "onClick"); tree = render(); invoke(tree.filter(n => n.type === "input")[1], "onChange"); tree = render();
  assert.equal(tree.find(n => n.type === "button")!.props["aria-expanded"], true);
  assert.deepEqual(selected, ["open", "closed"]); assert.equal(tree.find(n => n.type === "button")!.props.title, "Open, Closed");
  invoke(tree[0], "onKeyDown", { key: "Escape", preventDefault() {}, stopPropagation() {} });
  assert.equal(render().find(n => n.type === "button")!.props["aria-expanded"], false); assert.equal(focused, 1);
  invoke(render().find(n => n.type === "button")!, "onClick");
  invoke(render()[0], "onBlur", { relatedTarget: {}, currentTarget: { contains: () => true } });
  assert.equal(render().find(n => n.type === "button")!.props["aria-expanded"], true);
  invoke(render()[0], "onBlur", { relatedTarget: {}, currentTarget: { contains: () => false } });
  assert.equal(render().find(n => n.type === "button")!.props["aria-expanded"], false);
});
