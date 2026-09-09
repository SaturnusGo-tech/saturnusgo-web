import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { CollisionDetection } from "@dnd-kit/core";
import { widgetCollisions } from "../customize/grid/collision/widgetCollisions";

test("unequal widget sizes target the intended counter with keyboard and pointer", () => {
  const rect = (left: number, top: number, width: number, height: number) =>
    ({ left, top, width, height, right: left + width, bottom: top + height });
  const metric = rect(96, 242, 280, 124), panel = rect(96, 386, 1156, 196);
  const containers = ["metric", "panel"].map((id, i) => ({ id, key: id, disabled: false,
    data: { current: {} }, node: { current: null }, rect: { current: i ? panel : metric } }));
  const args: Parameters<CollisionDetection>[0] = {
    active: { id: "panel", data: { current: {} }, rect: { current: { initial: panel, translated: null } } },
    collisionRect: rect(96, 242, 1156, 196),
    droppableRects: new Map([["metric", metric], ["panel", panel]]),
    droppableContainers: containers, pointerCoordinates: null,
  };
  assert.equal(widgetCollisions(args)[0].id, "metric");
  assert.equal(widgetCollisions({ ...args, pointerCoordinates: { x: 114, y: 260 } })[0].id, "metric");
  assert.equal(widgetCollisions({ ...args, collisionRect: panel })[0].id, "panel");
  assert.equal(widgetCollisions({ ...args, pointerCoordinates: { x: 700, y: 410 } })[0].id, "panel");
  assert.equal(widgetCollisions({ ...args, pointerCoordinates: { x: 240, y: 380 } }).length, 2);
});

const portfolio = readFileSync(new URL("../sections/DashboardPortfolio.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../dashboard.module.css", import.meta.url), "utf8");
const english = readFileSync(new URL("../../../localization/catalog/dashboard/en.ts", import.meta.url), "utf8");
const russian = readFileSync(new URL("../../../localization/catalog/dashboard/ru.ts", import.meta.url), "utf8");
const inspector = readFileSync(new URL("../inspector/DashboardDrillInspector.tsx", import.meta.url), "utf8");
const modal = readFileSync(new URL("../../common/modal/Modal.tsx", import.meta.url), "utf8");
const breakdowns = readFileSync(new URL("../charts/DashboardBreakdowns.tsx", import.meta.url), "utf8");
const dashboard = readFileSync(new URL("../DashboardView.tsx", import.meta.url), "utf8");
const trend = readFileSync(new URL("../charts/DashboardTrendChart.tsx", import.meta.url), "utf8");
const tooltip = readFileSync(new URL("../common/DashboardChartTooltip.tsx", import.meta.url), "utf8");
const drillTable = readFileSync(new URL("../inspector/table/DashboardDrillTable.tsx", import.meta.url), "utf8");

test("Recharts scales render with frozen runtime intrinsics", () => {
  const script = String.raw`
    const assert = require("node:assert/strict");
    const {
      rechartsScaleFactory,
    } = require("./node_modules/recharts/lib/util/scale/RechartsScale.js");
    const Decimal = require("./node_modules/decimal.js/decimal.js");
    const { getNiceTickValues, getTickValuesFixedDomain } =
      require("./node_modules/recharts/lib/util/scale/getNiceTickValues.js");

    function scale(value) {
      return value * 10;
    }
    scale.domain = () => [0, 10];
    scale.range = () => [100, 0];
    scale.ticks = () => [0, 5, 10];

    Object.freeze(Function.prototype);
    Object.freeze(Object.prototype);

    const decimal = new Decimal("0.1").plus("0.2");
    assert.equal(decimal.toString(), "0.3");
    assert.deepEqual(getNiceTickValues([0, 23], 6, false), [0, 5, 10, 15, 20, 25]);
    assert.deepEqual(getNiceTickValues([0, 0], 6, false), [0, 1, 2, 3, 4, 5]);
    assert.deepEqual(getNiceTickValues([0.1, 0.9], 5, true), [0, 0.25, 0.5, 0.75, 1]);
    assert.deepEqual(getNiceTickValues([0, 23], 6, false, "snap125"), [0, 5, 10, 15, 20, 25]);
    assert.deepEqual(getTickValuesFixedDomain([0, 23], 6, false), [0, 5, 10, 15, 20, 23]);

    const adapted = rechartsScaleFactory(scale);
    assert.deepEqual(adapted.domain(), [0, 10]);
    assert.deepEqual(adapted.range(), [0, 100]);
    assert.equal(adapted.rangeMin(), 0);
    assert.equal(adapted.rangeMax(), 100);
    assert.equal(adapted.map(4), 40);
    assert.deepEqual(adapted.ticks(3), [0, 5, 10]);
  `;

  const output = execFileSync(process.execPath, ["-e", script], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  assert.equal(output, "");
});

test("Decimal light ES module arithmetic and clones work with frozen intrinsics", () => {
  const script = String.raw`
    import assert from "node:assert/strict";
    import Decimal from "./node_modules/decimal.js-light/decimal.mjs";
    Object.freeze(Function.prototype);
    Object.freeze(Object.prototype);
    assert.equal(new Decimal("0.1").plus("0.2").toString(), "0.3");
    const LocalDecimal = Decimal.clone({ precision: 8 });
    const value = new LocalDecimal(1).div(3);
    assert.equal(value.toString(), "0.33333333");
    assert.equal(value.constructor, LocalDecimal);
    assert.equal(Object.isFrozen(Object.prototype), true);
  `;
  assert.equal(execFileSync(process.execPath, ["--input-type=module", "-e", script], {
    cwd: process.cwd(), encoding: "utf8",
  }), "");
});

test("risk headers remain readable without unexplained abbreviations", () => {
  for (const key of ["passRate", "coverageRate", "failedItems", "blockedItems", "defects"]) {
    assert.match(portfolio, new RegExp(`aria-label=\\{t\\("dashboard\\.${key}"\\)\\}`));
    assert.match(portfolio, new RegExp(`title=\\{t\\("dashboard\\.${key}"\\)\\}`));
    assert.match(portfolio, new RegExp(`dashboard\\.${key}Short`));
  }
  assert.match(english, /"dashboard\.blockedItemsShort": "Blocked"/);
  assert.match(russian, /"dashboard\.failedItemsShort": "Не пройдено"/);
  assert.match(russian, /"dashboard\.blockedItemsShort": "Заблокировано"/);
  assert.match(russian, /"dashboard\.coverageRateShort": "Охват"/);
  assert.match(styles, /\.hotspotHeader span\s*\{[^}]*min-width: 0;[^}]*white-space: normal;/s);
});

test("narrow dashboard preserves all risk columns inside its own scroll container", () => {
  assert.match(styles, /@media \(max-width: 720px\)[\s\S]*\.hotspotTable\s*\{\s*overflow-x: auto;/);
  assert.match(styles, /@media \(max-width: 720px\)[\s\S]*\.hotspotHeader, \.hotspotRow\s*\{\s*min-width: 650px;/);
});

test("run flow keeps case pass rate separate from count-based trend series", () => {
  const trendStyles = readFileSync(new URL("../charts/trend.module.css", import.meta.url), "utf8");
  assert.doesNotMatch(trend, /dataKey="passRate"/);
  assert.match(trend, /className=\{styles\.flowRate\}/);
  assert.match(trend, /dashboard\.casePassRate/);
  assert.match(trendStyles, /\.flowRate\s*\{/);
});

test("risk rows use one coverage bar and a distinct pass-rate score", () => {
  assert.match(portfolio, /className=\{surface\.passRateScore\}/);
  assert.match(portfolio, /className=\{surface\.coverageCell\}/);
  assert.equal((portfolio.match(/<progress\b/g) ?? []).length, 1);
  assert.match(styles, /\.coverageCell progress::-webkit-progress-value/);
});

test("dashboard drill-downs use full pages and retain contextual navigation", () => {
  assert.doesNotMatch(inspector, /<Modal|adaptiveSheet/);
  assert.match(inspector, /<DetailPage/);
  assert.match(inspector, /onOpenEntity\(tab, props\.selected\)/);
  assert.match(inspector, /relatedDashboardDrill/);
  assert.match(inspector, /<ComponentRail/);
  assert.match(inspector, /<GroupedChecks/);
  assert.match(inspector, /<DetailToolbar/);
  assert.match(inspector, /props\.onCreateRun\(\[\.\.\.selection\]\)/);
});

test("analytics listings retain the priority signal and accessible navigation", () => {
  assert.match(drillTable, /<PrioritySignal priority=\{row\.priority\}/);
  assert.match(drillTable, /className=\{styles\.prioritySortButton\}/);
  assert.match(drillTable, /<DetailStatus status=\{row\.status\}/);
  assert.match(drillTable, /aria-sort/);
  assert.match(drillTable, /onOpenRow\(row\)/);
});

test("dashboard uses custom menus and theme-safe chart tooltips", () => {
  for (const source of [dashboard, trend, inspector]) assert.doesNotMatch(source, /<select\b/);
  assert.match(trend, /DashboardChartTooltip/);
  assert.match(tooltip, /surface\.chartTooltip/);
  assert.match(styles, /\.chartTooltip\s*\{/);
  assert.match(styles, /\.overflowMarquee[^}]*text-overflow: ellipsis/s);
});

test("dashboard copy does not expose implementation details", () => {
  for (const catalog of [english, russian]) {
    assert.doesNotMatch(catalog, /workspaceId|projectId|entity basis|server analytics|серверная аналитика|адаптер|run-item/i);
  }
});

test("tag and coverage rows retain theme colors and covered/uncovered drill actions", () => {
  const rowStyles = readFileSync(new URL("../charts/breakdowns.module.css", import.meta.url), "utf8");
  assert.match(rowStyles, /background: var\(--row-color\)/);
  assert.match(breakdowns, /onOpenDrill\(item\.drills\.covered!/);
  assert.match(breakdowns, /onOpenDrill\(item\.drills\.uncovered!/);
  assert.match(breakdowns, /onOpenDrill\(\{ \.\.\.item\.drill, label: item\.label \}\)/);
  for (const token of ["dash-teal", "dash-violet", "dash-orange", "dash-cyan", "dash-rose"]) {
    assert.match(styles, new RegExp(`--${token}:`));
  }
  for (const token of ["dash-blue", "dash-success", "dash-danger", "dash-warning", "dash-aborted"]) {
    assert.match(styles, new RegExp(`--${token}:`));
  }
  assert.doesNotMatch(styles, /--dash-(plum|sand|olive|coral):/);
});
