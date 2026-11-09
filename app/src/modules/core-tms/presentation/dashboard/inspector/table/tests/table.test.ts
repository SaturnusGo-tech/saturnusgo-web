import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import { componentHarness, invoke, nodes } from "../../../../../portfolios/tests/support/component-harness";
import type { DashboardDrillRow } from "../../../../../dashboards/model/dashboard-analytics";
import type { DashboardDrillTable } from "../DashboardDrillTable";
import type { DefectDrillList } from "../defects/DefectDrillList";
const row = (id: string, entity: DashboardDrillRow["entity"] = "defect"): DashboardDrillRow => ({ id, entity, projectId: "p", key: `HOST-${id}`,
  title: "A very long defect title ".repeat(15), project: "Project", component: "A very long product name ".repeat(15),
  priority: "high", status: "ready_for_retest", detail: "", links: [], occurredAt: "2026-11-03T00:00:00Z" });
function setup(t: TestContext) {
  const h = componentHarness(); t.after(h.dispose);
  function resolve(name: string) {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en", languageTag: "en-US", t: (key: string) => key }) };
    if (name.endsWith("/labels")) return { localizedLabel: (_locale: string, value: string) => value };
    if (name.endsWith("PrioritySignal")) return { isPrioritySignalLevel: (value: string) => value === "high", PrioritySignal: "PrioritySignal" };
    if (name.endsWith("PriorityIcon")) return { priorityLabel: (_locale: string, value: string) => value, PriorityIcon: "PriorityIcon" };
    if (name.endsWith("DefectDrillList")) return { DefectDrillList: "DefectDrillList" };
    if (name.endsWith("RecordSignals")) return { DetailStatus: "DetailStatus", DetailProgress: "DetailProgress" };
  }
  const View = h.load<{ DashboardDrillTable: typeof DashboardDrillTable }>(new URL("../DashboardDrillTable.tsx", import.meta.url), resolve).DashboardDrillTable;
  const Defects = h.load<{ DefectDrillList: typeof DefectDrillList }>(new URL("../defects/DefectDrillList.tsx", import.meta.url), resolve).DefectDrillList;
  return { h, View, Defects };
}
test("long titles and products retain full text and independent truncation targets", t => {
  const { h, Defects } = setup(t), item = row("1");
  const tree = nodes(h.render(() => Defects({ rows: [item], onOpenRow() {} })));
  assert.ok(tree.some(node => node.type === "span" && node.props.className === "title" && node.props.title === item.title));
  assert.ok(tree.some(node => node.type === "span" && node.props.className === "product" && node.props.title === item.component));
  assert.ok(tree.some(node => node.props.status === item.status && node.props.label === item.status));
});
test("active and archived defect rows have one action and use the test case priority icon", t => {
  const { h, View, Defects } = setup(t), active = row("1"), archived = { ...row("2"), archivedAt: "2026-11-04T00:00:00Z" };
  const opened: DashboardDrillRow[] = [];
  archived.links = [{ label: "Tracker", url: "https://tracker.example/issue/2" }];
  const props = { rows: [active, archived], onOpenRow: (value: DashboardDrillRow) => opened.push(value) };
  const shell = nodes(h.render(() => View({ ...props, prioritySort: null, onPrioritySort() {} })));
  assert.equal(shell[0].type, "DefectDrillList");
  const tree = nodes(h.render(() => Defects(props)));
  assert.equal(tree.filter(node => node.type === "PriorityIcon" && node.props.level === "high").length, 2);
  assert.equal(tree.filter(node => node.type === "a").length, 0);
  assert.equal(tree.some(node => node.props.children === archived.key || node.props.children === "Archived"), false);
  const buttons = tree.filter(node => node.type === "button");
  assert.equal(buttons.length, 2);
  buttons.forEach(button => invoke(button, "onClick"));
  assert.equal(opened[0], active); assert.equal(opened[1], archived);
});
test("row and arrow navigation retain the precise record; unsafe external URLs are never rendered", t => {
  const { h, View } = setup(t), item = row("1", "run"), opened: DashboardDrillRow[] = [];
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
  const tree = nodes(h.render(() => View({ rows: [row("a", "test_case")], prioritySort: "desc", onPrioritySort: () => { sorted++; }, onOpenRow() {} })));
  assert.ok(tree.some(node => node.type === "th" && node.props["aria-sort"] === "descending"));
  invoke(tree.find(node => node.type === "button" && node.props.className === "prioritySortButton")!, "onClick"); assert.equal(sorted, 1);
  const run = nodes(h.render(() => View({ rows: [row("b", "run")], prioritySort: null, onPrioritySort() {}, onOpenRow() {} })));
  assert.equal(run.some(node => node.type === "DetailProgress"), false);
});
