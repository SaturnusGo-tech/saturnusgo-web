import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
import type { DashboardDrill, DashboardSnapshot } from "../../../../dashboards/model/dashboard-analytics";

type Node = { type: string; props: Record<string, any> };
const jsx = (type: string, props: Record<string, any>) => ({ type, props });
function harness(reduced: boolean | null = false) {
  const states: any[] = [];
  let cursor = 0;
  const module = { exports: {} as { DashboardTrendChart: (props: any) => Node } };
  const compiled = ts.transpileModule(readFileSync(new URL("../DashboardTrendChart.tsx", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  runInNewContext(compiled, { module, exports: module.exports, Intl, Date,
    require(name: string) {
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx, Fragment: "Fragment" };
      if (name === "react") return { useId: () => "trend-title", useState: (initial: any) => {
        const index = cursor++; if (!(index in states)) states[index] = initial;
        return [states[index], (next: any) => { states[index] = typeof next === "function" ? next(states[index]) : next; }];
      } };
      if (name === "framer-motion") return { useReducedMotion: () => reduced };
      if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en", languageTag: "en-US", t: (key: string) => key }) };
      if (name.endsWith("/labels")) return { localizedLabel: (_locale: string, value: string) => value };
      if (name.endsWith(".css")) return { __esModule: true, default: new Proxy({}, { get: (_target, key) => key }) };
      return new Proxy({}, { get: (_target, key) => key });
    },
  });
  const drills: DashboardDrill[] = [];
  return { drills, render(snapshot = data) { cursor = 0; return module.exports.DashboardTrendChart({ snapshot, onOpenDrill: (drill: DashboardDrill) => drills.push(drill) }); } };
}
function nodes(value: any): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !value.props) return [];
  return [value, ...nodes(value.props.children)];
}
const find = (tree: Node, type: string) => nodes(tree).find((node) => node.type === type)!;
const button = (tree: Node, label: string) => nodes(tree).find((node) => node.type === "button" && node.props["aria-label"]?.startsWith(label))!;
const data: DashboardSnapshot = {
  generatedAt: "2026-09-07T12:00:00Z", query: { workspaceId: "workspace", projectId: "project", period: "7d" },
  metrics: { passRate: 50, casePassRate: 75, currentCases: 0, casesCreated: 0, runsLaunched: 3, completedRuns: 2, passedRuns: 1,
    activeRuns: 0, currentDefects: 0, openDefects: 0, reportedDefects: 0, linkedDefects: 0 },
  runOutcomes: [], caseTypes: [], tags: [], hotspots: [], defects: [], dataNotes: [],
  trend: [
    { day: "2026-09-06", start: "2026-09-06T00:00:00Z", end: "2026-09-07T00:00:00Z", launched: 3, passed: 1, failed: 1, blocked: 0, incomplete: 0, not_started: 0, aborted: 0, passRate: 50 },
    { day: "2026-09-07", start: "2026-09-07T00:00:00Z", end: "2026-09-08T00:00:00Z", launched: 0, passed: 0, failed: 0, blocked: 0, incomplete: 0, not_started: 0, aborted: 0, passRate: null },
  ],
};

test("chart uses authoritative daily run counts, while case pass rate stays a separate metric", () => {
  const h = harness(); const tree = h.render();
  assert.equal(find(tree, "ComposedChart").props.data, data.trend);
  assert.equal(find(tree, "YAxis").props.allowDecimals, false);
  assert.equal(find(tree, "YAxis").props.domain[0], 0);
  assert.equal(nodes(tree).some((node) => ["Line", "Area"].includes(node.type) && node.props.dataKey === "passRate"), false);
  button(tree, "dashboard.casePassRate: 75%").props.onClick();
  assert.equal(h.drills[0].filter.entity, "run_item");
  assert.equal((h.drills[0].filter as { status: string }).status, "passed");
});

test("keyboard date selection includes zero days and preserves exact day drills and unknown pass rate", () => {
  const h = harness(); let tree = h.render();
  const picker = find(tree, "AnimatedSelect");
  assert.equal(picker.props.options.length, 3);
  picker.props.onChange(data.trend[1].start); tree = h.render();
  assert.equal(button(tree, "dashboard.casePassRate: —").props.disabled, true);
  assert.equal(nodes(tree).some((node) => node.props["aria-label"]?.includes("—%")), false);
  button(tree, "dashboard.open.run: failed, 0").props.onClick();
  assert.equal(h.drills[0].filter.entity, "run");
  assert.equal(h.drills[0].window?.from, data.trend[1].start);
  assert.equal(h.drills[0].window?.to, data.trend[1].end);
  const line = nodes(tree).find((node) => node.type === "Line" && node.props.dataKey === "failed")!;
  line.props.activeDot({ index: 0 }).props.onClick();
  assert.equal(h.drills[1].window?.from, data.trend[0].start);
});

test("series toggles keep one count series visible without changing drill counts", () => {
  const h = harness(); let tree = h.render();
  for (const name of ["dashboard.launched", "passed", "failed", "blocked", "dashboard.incomplete", "dashboard.notStarted"]) {
    button(tree, `dashboard.hideSeries: ${name}`).props.onClick(); tree = h.render();
  }
  assert.equal(button(tree, "dashboard.hideSeries: dashboard.aborted").props.disabled, true);
  assert.equal(nodes(tree).filter((node) => ["Area", "Line"].includes(node.type) && !node.props.hide).length, 1);
  button(tree, "dashboard.showSeries: failed").props.onClick(); tree = h.render();
  assert.equal(button(tree, "dashboard.hideSeries: failed").props["aria-pressed"], true);
  button(tree, "dashboard.open.run: failed, 1").props.onClick();
  assert.equal((h.drills[0].filter as { outcome: string }).outcome, "failed");
});

test("reduced motion disables chart animation and stale date selection cannot reuse a previous window", () => {
  const h = harness(true); let tree = h.render();
  assert.equal(nodes(tree).filter((node) => ["Area", "Line"].includes(node.type)).every((node) => node.props.isAnimationActive === false), true);
  find(tree, "AnimatedSelect").props.onChange(data.trend[0].start);
  tree = h.render({ ...data, trend: [data.trend[1]] });
  assert.equal(find(tree, "AnimatedSelect").props.value, "all");
  button(tree, "dashboard.open.run: failed, 0").props.onClick();
  assert.equal(h.drills[0].window, undefined);
  assert.equal(nodes(tree).some((node) => node.type === "ComposedChart"), false);
});
