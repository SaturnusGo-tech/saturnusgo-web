import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import { componentHarness, invoke, nodes } from "../../../../../portfolios/tests/support/component-harness";
import type { DashboardDrillRow } from "../../../../../dashboards/model/dashboard-analytics";
import type { DashboardDrillTable } from "../DashboardDrillTable";
const row = (id: string, entity: DashboardDrillRow["entity"] = "defect"): DashboardDrillRow => ({ id, entity, projectId: "p", key: `HOST-${id}`,
  title: "A very long defect title ".repeat(15), project: "Project", component: "A very long product name ".repeat(15),
  priority: "high", status: "ready_for_retest", detail: "", links: [], occurredAt: "2026-11-03T00:00:00Z" });
function setup(t: TestContext) {
  const h = componentHarness(); t.after(h.dispose);
  return { h, View: h.load<{ DashboardDrillTable: typeof DashboardDrillTable }>(new URL("../DashboardDrillTable.tsx", import.meta.url), name => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en", languageTag: "en-US", t: (key: string) => key }) };
    if (name.endsWith("/labels")) return { localizedLabel: (_locale: string, value: string) => value };
    if (name.endsWith("PrioritySignal")) return { isPrioritySignalLevel: (value: string) => value === "high", PrioritySignal: "PrioritySignal" };
    if (name.endsWith("RecordSignals")) return { DetailStatus: "DetailStatus", DetailProgress: "DetailProgress" };
  }).DashboardDrillTable };
}
test("long titles and products retain full text and independent truncation targets", t => {
  const { h, View } = setup(t), item = row("1");
  const tree = nodes(h.render(() => View({ rows: [item], prioritySort: null, onPrioritySort() {}, onOpenRow() {} })));
  assert.ok(tree.some(node => node.type === "button" && node.props.title === item.title));
  assert.ok(tree.some(node => node.type === "span" && node.props.className === "cellValue" && node.props.title === item.component));
  assert.ok(tree.some(node => node.type === "DetailStatus" && node.props.status === item.status));
});
test("row and arrow navigation retain the precise record; unsafe external URLs are never rendered", t => {
  const { h, View } = setup(t), item = row("1"), opened: DashboardDrillRow[] = [];
  item.links = [{ label: "Unsafe", url: "javascript:alert(1)" }, { label: "Tracker", url: "https://tracker.example/issue/1" }];
  const tree = nodes(h.render(() => View({ rows: [item], prioritySort: null, onPrioritySort() {}, onOpenRow: value => opened.push(value) })));
  const links = tree.filter(node => node.type === "a"); assert.equal(links.length, 1); assert.equal(links[0].props.href, item.links[1].url);
  invoke(tree.find(node => node.type === "button" && node.props.title === item.title)!, "onClick");
  invoke(tree.find(node => node.type === "button" && node.props["aria-label"] === `dashboard.openRecord: ${item.title}`)!, "onClick");
  assert.equal(opened[0], item); assert.equal(opened[1], item);
});
test("visible-case selection preserves selected cases outside the loaded rows", t => {
  const { h, View } = setup(t); let selected = new Set(["outside"]); const rows = [row("a", "test_case"), row("b", "test_case")];
  const render = () => nodes(h.render(() => View({ rows, prioritySort: null, onPrioritySort() {}, onOpenRow() {}, selection: selected, onSelection: value => { selected = value; } })));
  const all = () => render().find(node => node.type === "input" && node.props["aria-label"] === "Select visible test cases")!;
  invoke(all(), "onChange", { target: { checked: true } }); assert.deepEqual([...selected], ["outside", "a", "b"]);
  invoke(all(), "onChange", { target: { checked: false } }); assert.deepEqual([...selected], ["outside"]);
});
test("priority sorting stays accessible and run progress is not replaced by invented values", t => {
  const { h, View } = setup(t); let sorted = 0;
  const tree = nodes(h.render(() => View({ rows: [row("a")], prioritySort: "desc", onPrioritySort: () => { sorted++; }, onOpenRow() {} })));
  assert.ok(tree.some(node => node.type === "th" && node.props["aria-sort"] === "descending"));
  invoke(tree.find(node => node.type === "button" && node.props.className === "prioritySortButton")!, "onClick"); assert.equal(sorted, 1);
  const run = nodes(h.render(() => View({ rows: [row("b", "run")], prioritySort: null, onPrioritySort() {}, onOpenRow() {} })));
  assert.equal(run.some(node => node.type === "DetailProgress"), false);
});
