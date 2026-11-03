import assert from "node:assert/strict";
import { test } from "node:test";
import { componentHarness, invoke, nodes } from "../../../../../portfolios/tests/support/component-harness";
import type { DashboardDrillRow } from "../../../../../dashboards/model/dashboard-analytics";
import type { GroupedChecks } from "../GroupedChecks";
test("group collapse and exact run-item navigation survive long-content presentation", t => {
  const h = componentHarness(); t.after(h.dispose);
  const View = h.load<{ GroupedChecks: typeof GroupedChecks }>(new URL("../GroupedChecks.tsx", import.meta.url), name => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
    if (name.endsWith("RecordSignals")) return { DetailStatus: "DetailStatus", DetailProgress: "DetailProgress" };
  }).GroupedChecks;
  const item: DashboardDrillRow = { id: "item", runId: "run", runItemId: "item", projectId: "p", entity: "run_item", title: "Long case ".repeat(30),
    key: "RUN · TC-1", caseKey: "TC-1", project: "Project", component: "Long product ".repeat(25), detail: "", status: "blocked", links: [] };
  const run = { ...item, id: "run", entity: "run" as const, title: "Long run title ".repeat(25) };
  const opened: DashboardDrillRow[] = []; const render = () => nodes(h.render(() => View({ groups: [{ key: "group", run, rows: [item] }], onOpenRow: value => opened.push(value) })));
  let tree = render(); assert.ok(tree.some(node => node.type === "strong" && node.props.title === run.title));
  assert.ok(tree.some(node => node.type === "span" && node.props.title === item.component));
  invoke(tree.find(node => node.type === "button" && node.props.className === "row")!, "onClick"); assert.equal(opened[0], item);
  invoke(tree.find(node => node.type === "button" && node.props.className === "open")!, "onClick"); assert.equal(opened[1], run);
  invoke(tree.find(node => node.type === "button" && node.props.className === "toggle")!, "onClick");
  tree = render(); assert.equal(tree.some(node => node.type === "button" && node.props.className === "row"), false);
  assert.equal(tree.find(node => node.type === "button" && node.props.className === "toggle")!.props["aria-expanded"], false);
  invoke(tree.find(node => node.type === "button" && node.props.className === "toggle")!, "onClick");
  assert.equal(render().find(node => node.type === "button" && node.props.className === "row")!.props.children !== undefined, true);
});
