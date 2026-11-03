import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes } from "../../../../../portfolios/tests/support/component-harness";
import type { DetailToolbar } from "../DetailToolbar";
const locale = { useTmsLocale: () => ({ locale: "en", t: (key: string) => key }) };
function setup() {
  const h = componentHarness();
  const { DetailToolbar: Toolbar, emptyDetailFilters } = h.load<{ DetailToolbar: typeof DetailToolbar; emptyDetailFilters: () => Parameters<typeof DetailToolbar>[0]["filters"] }>(new URL("../DetailToolbar.tsx", import.meta.url), name =>
    name.endsWith("useTmsLocale") ? locale : name.endsWith("labels") ? { localizedLabel: (_: string, value: string) => value } : undefined);
  let filters = { ...emptyDetailFilters(), status: ["open", "verified"] }; let focused = 0;
  const render = () => nodes(h.render(() => Toolbar({ rows: [], filters, onFilters: next => { filters = next; }, sort: "recent", onSort() {}, partial: true, scopeCount: 2, scopeFields: "product-fields" })));
  const trigger = (tree: ReturnType<typeof render>) => tree.find(n => n.type === "button" && n.props["aria-controls"])!;
  const first = render(); (trigger(first).props.ref as { current: unknown }).current = { focus: () => focused++ };
  return { h, render, trigger, filters: () => filters, focused: () => focused };
}
test("one inline disclosure retains scope fields and active restrictions while collapsed", t => {
  const s = setup(); t.after(() => s.h.dispose()); let tree = s.render();
  assert.equal(s.trigger(tree).props["aria-expanded"], false);
  assert.equal(tree.find(n => n.props.id === s.trigger(tree).props["aria-controls"])!.props.inert, true);
  assert.equal(tree.filter(n => n.type === "aside").length, 0);
  assert.ok(tree.some(n => n.props["aria-label"] === "Applied filters"));
  invoke(s.trigger(tree), "onClick"); tree = s.render();
  assert.equal(s.trigger(tree).props["aria-expanded"], true);
  assert.equal(tree.find(n => n.props.id === s.trigger(tree).props["aria-controls"])!.props.inert, false);
});
test("Escape restores focus but respects a nested selector handling its own Escape", t => {
  const s = setup(); t.after(() => s.h.dispose()); invoke(s.trigger(s.render()), "onClick");
  let tree = s.render(); const event = { key: "Escape", defaultPrevented: true, preventDefault() {}, stopPropagation() {} };
  invoke(tree[0], "onKeyDown", event); assert.equal(s.trigger(s.render()).props["aria-expanded"], true);
  invoke(tree[0], "onKeyDown", { ...event, defaultPrevented: false });
  assert.equal(s.trigger(s.render()).props["aria-expanded"], false); assert.equal(s.focused(), 1);
});
test("removing one visible filter chip preserves the other selected filters", t => {
  const s = setup(); t.after(() => s.h.dispose());
  invoke(s.render().find(n => n.props["aria-label"] === "Remove filter: open")!, "onClick");
  assert.deepEqual(s.filters().status, ["verified"]);
});
