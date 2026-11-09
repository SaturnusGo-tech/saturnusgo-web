import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import React, { useState } from "react";
import { act, create, type ReactTestRenderer, type ReactTestInstance } from "react-test-renderer";
import type {
  DashboardAnalyticsSource, DashboardDrill, DashboardDrillPage, DashboardDrillRequest, DashboardSnapshot,
} from "../../../../../../../dashboards/model/dashboard-analytics";
import { defectInsightView, type InsightMeasure } from "../model/insight-view";
import { canOpenInsightRecord, useInsightRecords } from "../records/useInsightRecords";

const snapshot: DashboardSnapshot = {
  generatedAt: "2026-11-07T12:00:00.000Z", query: { workspaceId: "w", projectId: "p", period: "7d" },
  metrics: { currentCases: 0, casesCreated: 0, currentDefects: 5, openDefects: 4,
    reportedDefects: 2, linkedDefects: 1, passRate: null, activeRuns: 0, completedRuns: 0,
    runsLaunched: 0, passedRuns: 0 },
  caseTypes: [], defects: [], trend: [], runOutcomes: [], tags: [], hotspots: [], dataNotes: [],
};

const textContent = (node: ReactTestInstance): string => node.children.map(child =>
  typeof child === "string" ? child : textContent(child)).join("");

void test("preview replaces its records on selection and keeps the full drill aligned", async context => {
  const require = createRequire(import.meta.url), css = require.extensions[".css"];
  require.extensions[".css"] = module => { module.exports = {}; };
  const react = Object.getOwnPropertyDescriptor(globalThis, "React");
  Object.assign(globalThis, { React });
  context.after(() => {
    if (css) require.extensions[".css"] = css; else delete require.extensions[".css"];
    if (react) Object.defineProperty(globalThis, "React", react); else Reflect.deleteProperty(globalThis, "React");
  });
  const { InsightsChart } = await import("../chart/InsightsChart");
  const { InsightsList } = await import("../chart/InsightsList");
  const calls: { request: DashboardDrillRequest; signal?: AbortSignal; resolve: (page: DashboardDrillPage) => void }[] = [];
  const readDrill: DashboardAnalyticsSource["drill"] = (request, signal) =>
    new Promise(resolve => calls.push({ request, signal, resolve }));
  const opened: DashboardDrill[] = [];
  const insights = defectInsightView({ total: 4, groupCount: 2, truncated: false, periodApplied: false,
    period: { from: "2026-11-01T00:00:00.000Z", to: "2026-11-07T00:00:00.000Z" },
    groups: [
      { key: "Checkout", label: "Checkout", count: 3, segments: [{ key: "open", count: 3 }] },
      { key: "Booking", label: "Booking", count: 1, segments: [{ key: "closed", count: 1 }] },
    ],
  }, { query: snapshot.query, basis: "current", groupBy: "assignee", segmentBy: "status" }, "en");
  function Surface({ interactive }: { interactive: boolean }) {
    const [selected, setSelected] = useState<InsightMeasure>();
    const drill = interactive ? selected?.drill : undefined;
    const { rows } = useInsightRecords(snapshot.query, drill, readDrill);
    return <>
      <InsightsChart groups={insights.groups} number={new Intl.NumberFormat("en-US")} label="Assignee"
        selected={drill?.id} onSelect={interactive ? setSelected : undefined} />
      <InsightsList groups={insights.groups} number={new Intl.NumberFormat("en-US")} dimension="Assignee" metric="Count"
        empty="No matching records" selected={drill?.id} onSelect={interactive ? setSelected : undefined} />
      {drill && <button type="button" onClick={() => opened.push(drill)}>dashboard.openAll</button>}
      {rows?.map(row => canOpenInsightRecord(row) ? <button key={row.id} type="button">{row.title}</button>
        : <span key={row.id}>{row.title}</span>)}
    </>;
  }
  const row = (title: string, archivedAt?: string): DashboardDrillPage => ({ rows: [{ id: title, key: "QA-1", title,
    entity: "defect", projectId: "p", project: "QA", detail: "", links: [], archivedAt }] });
  let view!: ReactTestRenderer;
  const click = (message: string) => act(async () => {
    const button = view.root.findAllByType("button").find(candidate =>
      candidate.props["aria-label"] === message || textContent(candidate).includes(message));
    assert.ok(button, message);
    button.props.onClick();
  });

  await act(async () => { view = create(<Surface interactive />); });
  assert.equal(calls.length, 0);
  await click("Checkout · Open · 3");
  assert.equal(view.root.findAllByType("table").length, 0);
  const rowsList = view.root.findByProps({ "aria-label": "Assignee · Count" });
  assert.equal(rowsList.findAllByType("button").length, 4);
  const segment = rowsList.findByProps({ "aria-label": "Booking · Closed · 1" });
  await act(async () => { segment.props.onClick(); });
  assert.equal(segment.props["aria-pressed"], true);
  assert.deepEqual(calls.map(({ request }) => request.drill.filter), [
    { entity: "defect", basis: "current", assigneeIdentityId: "Checkout", status: "open" },
    { entity: "defect", basis: "current", assigneeIdentityId: "Booking", status: "closed" },
  ]);
  assert.equal(calls[0]?.signal?.aborted, true);
  assert.equal(calls[1]?.request.limit, 3);
  await act(async () => { calls[1]?.resolve(row("Closed result", "2026-11-08T00:00:00.000Z")); calls[0]?.resolve(row("Stale open result")); });
  assert.match(JSON.stringify(view.toJSON()), /Closed result/);
  assert.doesNotMatch(JSON.stringify(view.toJSON()), /Stale open result/);
  assert.equal(view.root.findAllByType("button").some(button => textContent(button).includes("Closed result")), false);
  await click("dashboard.openAll");
  assert.deepEqual(opened[0]?.filter, calls[1]?.request.drill.filter);

  await act(async () => { view.update(<Surface interactive={false} />); });
  assert.equal(view.root.findAllByType("button").some(button => button.props["aria-pressed"] !== undefined), false);
  assert.equal(calls.length, 2);
  await act(async () => view.unmount());
});
