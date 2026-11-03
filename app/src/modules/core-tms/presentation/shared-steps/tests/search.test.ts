import assert from "node:assert/strict";
import { test } from "node:test";
import { componentHarness, invoke, nodes } from "../../../portfolios/tests/support/component-harness";
import type { SharedStepSearch } from "../catalog/SharedStepSearch";
import type { SharedStepEmpty } from "../empty/SharedStepEmpty";

test("search reveals on demand, focuses the input and Escape clears the hidden filter", t => {
  const h = componentHarness(undefined, { requestAnimationFrame: (callback: () => void) => callback() }); t.after(() => h.dispose());
  const { SharedStepSearch: Search } = h.load<{ SharedStepSearch: typeof SharedStepSearch }>(new URL("../catalog/SharedStepSearch.tsx", import.meta.url));
  let value = "", focused = 0, stopped = 0;
  const render = () => nodes(h.render(() => Search({ value, onChange: next => { value = next; }, ru: false })));
  let tree = render(); const input = tree.find(node => node.type === "input")!, trigger = tree.find(node => node.type === "button")!;
  (input.props.ref as { current: unknown }).current = { focus: () => focused++ };
  (trigger.props.ref as { current: unknown }).current = { focus: () => focused++ };
  assert.equal(trigger.props["aria-expanded"], false);
  invoke(trigger, "onClick"); tree = render(); assert.equal(tree.find(node => node.type === "button")!.props["aria-expanded"], true); assert.equal(focused, 1);
  invoke(tree.find(node => node.type === "input")!, "onChange", { target: { value: "auth" } }); assert.equal(value, "auth");
  invoke(tree.find(node => node.type === "input")!, "onKeyDown", { key: "Escape", preventDefault() {}, stopPropagation() { stopped++; } });
  assert.equal(value, ""); assert.equal(stopped, 1); assert.equal(focused, 2);
  assert.equal(render().find(node => node.type === "button")!.props["aria-expanded"], false);
});
test("the initial empty state contains no duplicate create control", t => {
  const h = componentHarness(); t.after(() => h.dispose());
  const { SharedStepEmpty: Empty } = h.load<{ SharedStepEmpty: typeof SharedStepEmpty }>(new URL("../empty/SharedStepEmpty.tsx", import.meta.url));
  assert.equal(nodes(Empty({ searching: false, ru: false, onReset() {} })).some(node => node.type === "button"), false);
  assert.equal(nodes(Empty({ searching: true, ru: false, onReset() {} })).filter(node => node.type === "button").length, 1);
});
