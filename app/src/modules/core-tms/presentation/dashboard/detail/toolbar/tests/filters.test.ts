import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes } from "../../../../../portfolios/tests/support/component-harness";
import type { DashboardDrillRow } from "../../../../../dashboards/model/dashboard-analytics";
import type { DetailToolbar } from "../DetailToolbar";
import type { listFacets, updateListFacet, updateProductScope } from "../../../inspector/facets/model/drill-facets";

class ElementStub {}
const locale = { useTmsLocale: () => ({ locale: "en", t: (key: string) => key }) };
function setup() {
  const h = componentHarness("https://tms.example/work/", { requestAnimationFrame: (callback: () => void) => callback(), HTMLElement: ElementStub });
  const model = h.load<{ listFacets: typeof listFacets; updateListFacet: typeof updateListFacet; updateProductScope: typeof updateProductScope }>(new URL("../../../inspector/facets/model/drill-facets.ts", import.meta.url), name =>
    name.endsWith("labels") ? { localizedLabel: (_: string, value: string) => value } : name.endsWith("PriorityIcon") ? { priorityLevels: [], priorityLabel: (_: string, value: string) => value } : undefined);
  const { DetailToolbar: Toolbar, emptyDetailFilters } = h.load<{ DetailToolbar: typeof DetailToolbar; emptyDetailFilters: () => Parameters<typeof DetailToolbar>[0]["filters"] }>(new URL("../DetailToolbar.tsx", import.meta.url), name =>
    name.endsWith("useTmsLocale") ? locale : name.endsWith("drill-facets") ? model : name.endsWith("useDrillScope") ? { useDrillScope: () => ({ facets: [], chips: [] }) } : undefined);
  let filters = { ...emptyDetailFilters(), status: ["open", "verified"] };
  let sort: Parameters<typeof Toolbar>[0]["sort"] = "recent";
  const rows = [{ status: "open", project: "Test" }, { status: "verified", project: "Test", priority: "high" }] as DashboardDrillRow[];
  const render = () => nodes(h.render(() => Toolbar({ rows, filters, onFilters: next => { filters = next; }, sort, onSort: next => { sort = next; }, partial: true })));
  return { h, model, render, filters: () => filters };
}

test("search remains present while a compact filter control opens the floating menu", t => {
  const s = setup(); t.after(() => s.h.dispose());
  const trigger = () => s.render().find(n => n.props["aria-label"] === "Filters")!;
  assert.equal(trigger().props["aria-expanded"], false);
  assert.ok(s.render().some(n => n.type === "input" && n.props.type === "search"));
  assert.ok(!s.render().some(n => n.props.inert));
  invoke(trigger(), "onPress", { target: new ElementStub() });
  assert.equal(trigger().props["aria-expanded"], true);
  assert.ok(s.render().some(n => n.props.isOpen === true));
  assert.ok(s.render().some(n => n.type === "input" && n.props.type === "search"));
});
test("removing one visible filter chip preserves the other selected filters", t => {
  const s = setup(); t.after(() => s.h.dispose());
  invoke(s.render().find(n => n.props["aria-label"] === "Remove filter: open")!, "onPress", { pointerType: "mouse" });
  assert.deepEqual(s.filters().status, ["verified"]);
});
test("an active facet chip is an edit trigger with its own anchor", t => {
  const s = setup(); t.after(() => s.h.dispose());
  const chip = () => s.render().find(n => n.props["aria-label"] === "Edit filter: open")!;
  assert.equal(chip().props["aria-expanded"], false);
  invoke(chip(), "onPress", { target: new ElementStub() });
  assert.equal(chip().props["aria-expanded"], true);
  assert.equal(s.render().find(n => n.props["aria-label"] === "Filters")?.props["aria-expanded"], false);
});

test("editing a selected list value keeps other selections and avoids duplicates", t => {
  const s = setup(); t.after(() => s.h.dispose());
  assert.deepEqual([...s.model.updateListFacet(s.filters(), "status", "closed", "open").status], ["verified", "closed"]);
  assert.deepEqual([...s.model.updateListFacet(s.filters(), "status", "verified", "open").status], ["verified"]);
  assert.deepEqual([...s.model.updateListFacet(s.filters(), "status", "open").status], ["verified"]);
});
test("group and product selections retain their dependency and independent false regression", t => {
  const s = setup(); t.after(() => s.h.dispose());
  const scope = { productGroupId: "g1", productId: "p1", regression: false };
  assert.deepEqual({ ...s.model.updateProductScope(scope, "productGroupId", "g2") }, { productGroupId: "g2", regression: false });
  assert.deepEqual({ ...s.model.updateProductScope(scope, "productId", "p2", "g2") },
    { productGroupId: "g2", productId: "p2", regression: false });
  assert.deepEqual({ ...s.model.updateProductScope(scope, "productId") },
    { productGroupId: "g1", productId: undefined, regression: false });
  assert.deepEqual({ ...s.model.updateProductScope(scope, "regression") },
    { productGroupId: "g1", productId: "p1", regression: undefined });
});
