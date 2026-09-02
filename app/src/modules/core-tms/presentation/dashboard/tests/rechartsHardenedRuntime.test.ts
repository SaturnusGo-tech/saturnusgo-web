import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

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

test("Recharts scales render with frozen runtime intrinsics", () => {
  const script = String.raw`
    const assert = require("node:assert/strict");
    const {
      rechartsScaleFactory,
    } = require("./node_modules/recharts/lib/util/scale/RechartsScale.js");
    const Decimal = require("./node_modules/decimal.js/decimal.js");

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

test("risk headers remain readable without unexplained abbreviations", () => {
  for (const key of ["passRate", "coverageRate", "failedItems", "blockedItems", "defects"]) {
    assert.match(portfolio, new RegExp(`aria-label=\\{t\\("dashboard\\.${key}"\\)\\}`));
    assert.match(portfolio, new RegExp(`title=\\{t\\("dashboard\\.${key}"\\)\\}`));
    assert.match(portfolio, new RegExp(`dashboard\\.${key}Short`));
  }
  assert.match(english, /"dashboard\.blockedItemsShort": "Blocked"/);
  assert.match(russian, /"dashboard\.failedItemsShort": "Не пройдено"/);
  assert.match(russian, /"dashboard\.blockedItemsShort": "Заблокировано"/);
  assert.match(russian, /"dashboard\.coverageRateShort": "Покрытие"/);
  assert.match(styles, /\.hotspotHeader span\s*\{[^}]*min-width: 0;[^}]*white-space: normal;/s);
});

test("narrow dashboard keeps every risk column in a horizontally scrollable surface", () => {
  assert.match(styles, /@media \(max-width: 720px\)[\s\S]*\.hotspotTable\s*\{\s*min-width: 720px;\s*\}/);
  assert.match(styles, /@media \(max-width: 720px\)[\s\S]*\.portfolioPanel\s*\{\s*overflow-x: auto;\s*\}/);
});

test("analytics detail is a clean bottom sheet with working destinations", () => {
  assert.match(modal, /sheet \? styles\.modalBackdropSheet/);
  assert.match(modal, /sheet \? styles\.modalSheet/);
  assert.match(inspector, /<Modal sheet/);
  assert.doesNotMatch(inspector, /workspaceId|projectId\}|exactFilters|server filters/i);
  assert.doesNotMatch(inspector, /humanFilters|loadedDistribution|dashboardFilterValues/);
  assert.match(inspector, /onOpenEntity\(activeEntity, props\.selected\)/);
  assert.match(inspector, /relatedDashboardDrill/);
  assert.match(inspector, /<AnimatedSelect/);
  assert.match(styles, /\.drillSheetBody\s*\{[^}]*grid-template-columns: 250px minmax\(0, 1fr\)/s);
  assert.match(styles, /\.drillTable\s*\{[^}]*min-width: 980px/s);
});

test("dashboard uses custom menus and theme-safe chart tooltips", () => {
  for (const source of [dashboard, trend, inspector]) assert.doesNotMatch(source, /<select\b/);
  for (const source of [trend, breakdowns]) assert.match(source, /DashboardChartTooltip/);
  assert.match(tooltip, /surface\.chartTooltip/);
  assert.match(styles, /\.chartTooltip\s*\{/);
  assert.match(styles, /\.overflowMarquee\[data-overflow="true"\]/);
});

test("dashboard copy does not expose implementation details", () => {
  for (const catalog of [english, russian]) {
    assert.doesNotMatch(catalog, /workspaceId|projectId|entity basis|server analytics|серверная аналитика|адаптер|run-item/i);
  }
});

test("tag and coverage charts use a restrained categorical palette", () => {
  assert.match(breakdowns, /DIMENSION_COLORS/);
  assert.match(breakdowns, /<Cell key=\{item\.key\} fill=\{DIMENSION_COLORS/);
  for (const token of ["dash-teal", "dash-plum", "dash-sand", "dash-olive", "dash-coral"]) {
    assert.match(styles, new RegExp(`--${token}:`));
  }
});
