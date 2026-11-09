import assert from "node:assert/strict";
import { test } from "node:test";
import type { DashboardSnapshot } from "../../../../../../dashboards/model/dashboard-analytics";
import { componentHarness, invoke, nodes, type Node } from "../../../../../../portfolios/tests/support/component-harness";
import { metricValue } from "../../../widgets/model/metric-value";

const harness = componentHarness();
const resolve = (name: string) => {
  if (name.endsWith("/useTmsLocale")) return { useTmsLocale: () => ({ languageTag: "en-US", t: (key: string) => key }) };
  if (name.endsWith("/metric-value")) return { metricValue };
  if (name.endsWith("/widget-catalog")) return { widgetByKey: new Map() };
  if (name.endsWith("/WidgetCard")) return { WidgetAction: "WidgetAction", WidgetCard: "WidgetCard" };
  if (name.endsWith("/dashboardcn")) return { DashboardCnTheme: "DashboardCnTheme", KpiCard: "KpiCard", MetricValue: "MetricValue", TickBar: "TickBar" };
};
const { DashboardcnPortfolio } = harness.load<{ DashboardcnPortfolio: (props: Record<string, unknown>) => Node }>(
  new URL("../analytics/DashboardcnAnalytics.tsx", import.meta.url), resolve);
const { DashboardcnWidget } = harness.load<{ DashboardcnWidget: (props: Record<string, unknown>) => Node }>(
  new URL("../DashboardcnWidget.tsx", import.meta.url), resolve);

const cases = { id: "cases", label: "Cases", filter: { entity: "test_case", basis: "current" } } as const;
const passed = { id: "passed", label: "Passed", filter: { entity: "run_item", status: "passed" } } as const;
const covered = { id: "covered", label: "Covered", filter: { entity: "test_case", basis: "current", coverage: "covered" } } as const;
const metrics: DashboardSnapshot["metrics"] = {
  currentCases: 1, casesCreated: 0, currentDefects: 0, openDefects: 0, reportedDefects: 0, linkedDefects: 0,
  passRate: null, activeRuns: 0, completedRuns: 1, runsLaunched: 1, passedRuns: 0,
};

function snapshot(rate: number | null): DashboardSnapshot {
  return {
    generatedAt: "2026-11-09T12:00:00.000Z", query: { workspaceId: "w", projectId: "p", period: "7d" },
    metrics: { ...metrics, passRate: rate }, caseTypes: [], defects: [], trend: [], runOutcomes: [], tags: [], dataNotes: [],
    hotspots: [{ id: "component", kind: "component", label: "Checkout", caseCount: 1, coveredCases: null,
      failedItems: null, blockedItems: null, openDefects: null, criticalDefects: null, passRate: rate,
      coverageRate: rate, drills: { cases, passed, covered } }],
  };
}

function assertSegmentedMeter(element: Node, value: number, segments: number) {
  assert.equal(element.props.value, value);
  assert.equal(element.props.segments, segments);
  assert.equal(element.props.shape ?? "tick", "tick");
  assert.equal(element.props["aria-hidden"], "true");
}

void test("Components and risks shows numeric pass rate and segmented reach with each column's drill", () => {
  for (const value of [0, 37.5, 100, null]) {
    const opened: string[] = [];
    const view = DashboardcnPortfolio({ title: "Components and risks", snapshot: snapshot(value),
      openDrill: ({ id }: { id: string }) => opened.push(id) });
    const rateCells = nodes(view).filter(node => node.type === "td").slice(0, 2);
    for (const [index, cell] of rateCells.entries()) {
      if (value === null) {
        assert.equal(cell.props.children, "—");
        continue;
      }
      const children = nodes(cell);
      const meter = children.find(node => node.type === "TickBar");
      if (index === 0) assert.equal(meter, undefined);
      else {
        assert.ok(meter);
        assertSegmentedMeter(meter, value, 12);
      }
      assert.equal(children.find(node => node.type === "MetricValue")?.props.value, `${value}%`);
      const action = children.find(node => node.type === "WidgetAction");
      assert.ok(action);
      invoke(action, "onClick");
      assert.equal(opened[index], index === 0 ? passed.id : covered.id);
    }
  }
});

void test("Run pass rate shows a segmented meter with its numeric value and omits it when unavailable", () => {
  for (const value of [0, 37.5, 100, null]) {
    const view = DashboardcnWidget({ widget: "passRate", title: "Run pass rate", snapshot: snapshot(value), workbench: {} });
    const metric = view.props.children as Node;
    const contents = nodes((metric.type as unknown as (props: Node["props"]) => Node)(metric.props));
    assert.equal(contents.find(node => node.type === "KpiCard")?.props.value, value === null ? "—" : `${value}%`);
    const meter = contents.find(node => node.type === "TickBar");
    if (value === null) assert.equal(meter, undefined);
    else {
      assert.ok(meter);
      assertSegmentedMeter(meter, value, 20);
    }
  }
});
