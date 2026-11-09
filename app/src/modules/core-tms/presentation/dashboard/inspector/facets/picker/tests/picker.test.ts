import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes } from "../../../../../../portfolios/tests/support/component-harness";
import type { FacetPicker } from "../FacetPicker";

test("facet selection updates a controlled multiselect and keeps the list open", t => {
  class ElementStub {}
  const h = componentHarness("https://tms.example/work/", { HTMLElement: ElementStub }); t.after(() => h.dispose());
  const { FacetPicker: Picker } = h.load<{ FacetPicker: typeof FacetPicker }>(new URL("../FacetPicker.tsx", import.meta.url));
  let selected = ["open"];
  const render = () => nodes(h.render(() => Picker({ label: "Status", selected,
    options: [{ value: "open", label: "Open", count: 4 }, { value: "closed", label: "Closed", count: 3 }],
    onChoose: value => { selected = selected.includes(value) ? selected.filter(item => item !== value) : [...selected, value]; } })));
  const option = () => render().find(n => n.props["data-drill-facet-option"] === "closed")!;
  assert.equal(render().find(n => n.props["aria-label"] === "Status")?.props.selectionMode, "multiple");
  invoke(option(), "onPress", { target: new ElementStub() });
  assert.deepEqual(selected, ["open", "closed"]);
  assert.deepEqual(render().find(n => n.props["aria-label"] === "Status")?.props.selectedKeys, selected);
  invoke(option(), "onPress", { target: new ElementStub() });
  assert.deepEqual(selected, ["open"]);
});
