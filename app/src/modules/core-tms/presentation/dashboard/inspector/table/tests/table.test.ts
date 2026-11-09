import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import { componentHarness, invoke, nodes } from "../../../../../portfolios/tests/support/component-harness";
import type { DashboardDrillRow } from "../../../../../dashboards/model/dashboard-analytics";
import type { DashboardDrillList } from "../DashboardDrillList";
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
  const View = h.load<{ DashboardDrillList: typeof DashboardDrillList }>(new URL("../DashboardDrillList.tsx", import.meta.url), resolve).DashboardDrillList;
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
  const shell = nodes(h.render(() => View({ ...props })));
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
test("compact run rows preserve progress, status, precise navigation and safe links", t => {
  const { h, View } = setup(t), item = row("1", "run"), opened: DashboardDrillRow[] = [];
  item.links = [{ label: "Unsafe", url: "javascript:alert(1)" }, { label: "Tracker", url: "https://tracker.example/issue/1" }];
  const render = () => nodes(h.render(() => View({ rows: [item], onOpenRow: value => opened.push(value) })));
  const tree = render();
  const links = tree.filter(node => node.type === "a");
  assert.equal(links.length, 1); assert.equal(links[0].props.href, item.links[1].url);
  const buttons = tree.filter(node => node.type === "button");
  assert.equal(buttons.length, 1);
  invoke(buttons[0], "onClick");
  assert.equal(opened[0], item);
  assert.ok(tree.some(node => node.type === "DetailStatus" && node.props.status === item.status));
  assert.equal(tree.some(node => node.type === "DetailProgress"), false);
  item.progress = { total: 2, notRun: 1, inProgress: 0, passed: 1, failed: 0, blocked: 0, skipped: 0 };
  assert.ok(render().some(node => node.type === "DetailProgress" && node.props.progress === item.progress));
});

test("embedded defect rows retain the active and archived click targets", t => {
  const { h, Defects } = setup(t);
  const archived = { ...row("1"), archivedAt: "2026-11-04T00:00:00Z" };
  const opened: DashboardDrillRow[] = [];
  const tree = nodes(h.render(() => Defects({ compact: true, rows: [archived], onOpenRow: item => opened.push(item) })));
  assert.equal(tree.some(node => node.props.className === "product" || node.props.children === archived.key), false);
  const button = tree.find(node => node.type === "button")!;
  assert.equal(button.props.disabled, false);
  invoke(button, "onClick");
  assert.equal(opened[0], archived);
});
