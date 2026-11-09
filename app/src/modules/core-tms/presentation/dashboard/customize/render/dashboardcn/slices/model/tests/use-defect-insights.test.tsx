import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { DashboardDefectBreakdown, DashboardDefectBreakdownRequest } from
  "../../../../../../../../dashboards/model/breakdown/dashboard-defect-breakdown";
import { useDefectInsights } from "../useDefectInsights";

void test("keeps the last matrix during a same-scope refresh and clears it across workspace scopes", async () => {
  const current: DashboardDefectBreakdownRequest = {
    query: { workspaceId: "first", projectId: "p", period: "7d" }, basis: "current", groupBy: "assignee", segmentBy: "status",
  };
  const previous: DashboardDefectBreakdown = { total: 4, groupCount: 1, truncated: false,
    period: { from: "2026-11-01T00:00:00.000Z", to: "2026-11-07T00:00:00.000Z" },
    periodApplied: false, groups: [{ key: "A", label: "A", count: 4, segments: [{ key: "open", count: 4 }] }] };
  const calls: { signal?: AbortSignal; resolve: (data: DashboardDefectBreakdown) => void }[] = [];
  const read = (_request: DashboardDefectBreakdownRequest, signal?: AbortSignal) =>
    new Promise<DashboardDefectBreakdown>(resolve => calls.push({ signal, resolve }));
  let latest: ReturnType<typeof useDefectInsights>;
  function Matrix({ request }: { request: DashboardDefectBreakdownRequest }) {
    latest = useDefectInsights(request, read);
    return null;
  }
  let view!: ReactTestRenderer;
  await act(async () => { view = create(<Matrix request={current} />); });
  await act(async () => calls[0]?.resolve(previous));
  const changed: DashboardDefectBreakdownRequest = { ...current, groupBy: "component" };
  await act(async () => view.update(<Matrix request={changed} />));
  assert.equal(latest!.loading, true);
  assert.equal(latest!.data, undefined);
  assert.equal(latest!.previous?.data, previous);
  assert.equal(latest!.previous?.request.groupBy, "assignee");
  await act(async () => view.update(<Matrix request={{ ...changed, query: { ...changed.query, workspaceId: "second" } }} />));
  assert.equal(calls[1]?.signal?.aborted, true);
  await act(async () => calls[1]?.resolve(previous));
  assert.equal(latest!.previous, undefined);
  assert.equal(latest!.data, undefined);
  await act(async () => view.unmount());
});
