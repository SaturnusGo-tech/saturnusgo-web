import assert from "node:assert/strict";
import test from "node:test";
import { composition, coverageGapsFirst, rankedTags } from "../model/breakdown-data";
import { datum, hotspot, panelData } from "./support/panel-fixture";
import { nodes, panelHarness } from "./support/panel-harness";

test("composition preserves proportions without assigning area to zero counts", () => {
  const result = composition([datum("open", 15), datum("retest", 7), datum("closed", 0), datum("verified", 2)]);
  assert.deepEqual(result.map(item => item.key), ["open", "retest", "verified"]);
  assert.equal(result[0].share, 62.5);
  assert.equal(result.reduce((sum, item) => sum + item.share, 0), 100);
  assert.deepEqual(composition([datum("empty", 0)]), []);
});

test("tag ranking and coverage gap ordering keep source data intact", () => {
  assert.deepEqual(rankedTags(panelData.tags).map(item => item.key), ["high", "middle", "low"]);
  assert.deepEqual(panelData.tags.map(item => item.key), ["low", "high", "middle"]);
  const rows = coverageGapsFirst([...panelData.hotspots, hotspot("Empty", 0, 0)]);
  assert.deepEqual(rows.map(item => item.label), ["Gap", "Partial", "Complete"]);
  assert.equal(rows[1].coverageRate, 7 / 9 * 100);
  assert.equal(rows[1].uncoveredCases, 2);
  assert.equal(rows[0].coveredCases, 0);
});

test("defect strip uses real counts and every legend retains the source drill", () => {
  const h = panelHarness("../../../sections/DashboardOperations.tsx", "DashboardOperations");
  const tree = h.render(panelData);
  const segments = nodes(tree).filter(node => node.props["data-segment"]);
  assert.deepEqual(segments.map(node => node.props["data-segment"]), ["open", "ready_for_retest", "verified"]);
  assert.equal(segments[0].props.style.width, "62.5%");
  nodes(tree).find(node => node.type === "button" && node.props["aria-label"] === "closed: 0")!.props.onClick();
  assert.equal(h.drills[0].id, "closed");
  assert.equal(nodes(h.render({ ...panelData, defects: [] })).filter(node => node.props["data-segment"]).length, 0);
});

test("types show actual composition, tags rank, coverage explains counts and preserves both drills", () => {
  const h = panelHarness("../../DashboardBreakdowns.tsx", "DashboardBreakdowns");
  let tree = h.render(panelData, "types");
  assert.deepEqual(nodes(tree).filter(node => node.props["data-segment"]).map(node => node.props.style.width), ["75%", "25%"]);
  tree = h.render(panelData, "tags");
  const buttons = nodes(tree).filter(node => node.type === "button");
  assert.deepEqual(buttons.map(node => node.props["aria-label"]), ["high: 375", "middle: 100", "low: 10"]);
  buttons[1].props.onClick(); assert.equal(h.drills[0].id, "middle");
  tree = h.render(panelData, "coverage");
  const covered = nodes(tree).filter(node => node.type === "button" && node.props.className === "covered");
  assert.match(covered[0].props["aria-label"], /Gap:.*0\/10/);
  assert.match(covered[1].props["aria-label"], /Partial:.*7\/9/);
  covered[1].props.onClick();
  nodes(tree).find(node => node.type === "button" && node.props["aria-label"] === "Partial: dashboard.uncovered — 2")!.props.onClick();
  assert.equal(h.drills[1].id, "Partial:covered");
  assert.equal(h.drills[2].id, "Partial:uncovered");
  assert.equal(h.drills[2].projectId, "project");
});

test("outcomes remain complete and proportional, including empty outcome drills", () => {
  const h = panelHarness("../../../customize/widgets/OutcomeWidget.tsx", "OutcomeWidget");
  const tree = h.render(panelData);
  assert.equal(nodes(tree).filter(node => node.type === "button").length, 6);
  const segments = nodes(tree).filter(node => node.props["data-segment"]);
  assert.equal(segments.length, 2);
  assert.ok(Math.abs(parseFloat(segments[0].props.style.width) - 5 / 6 * 100) < .001);
  nodes(tree).find(node => node.type === "button" && node.props["aria-label"] === "aborted: 0")!.props.onClick();
  assert.equal(h.drills[0].id, "aborted");
});

test("risk matrix preserves all drill dimensions and displays unavailable values distinctly", () => {
  const h = panelHarness("../../../sections/DashboardPortfolio.tsx", "DashboardPortfolio");
  const tree = h.render(panelData);
  assert.equal(nodes(tree).find(node => node.props.role === "table")!.props["aria-colcount"], 6);
  for (const className of ["passRateScore", "coverageCell", "signalCell", "criticalSignal"]) {
    nodes(tree).find(node => node.type === "button" && node.props.className === className)!.props.onClick();
  }
  assert.deepEqual(h.drills.map(drill => drill.id), ["Complete:passed", "Complete:covered", "Complete:failed", "Complete:critical"]);
  const unknown = { ...hotspot("Unknown", 0, 1), failedItems: null, blockedItems: null, openDefects: null };
  const unavailable = h.render({ ...panelData, hotspots: [unknown] });
  assert.equal(nodes(unavailable).filter(node => node.type === "button" && node.props.className === "signalCell").length, 0);
});
