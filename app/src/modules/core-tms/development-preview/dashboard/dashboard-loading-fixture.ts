import { fallbackBootstrap } from "../../../../core/tms/fallback/bootstrap";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import type { components } from "../../../../core/tms/generated/tms-api";
import type { DashboardAnalyticsSource } from "../../dashboards/model/dashboard-analytics";
import type { DashboardDefectBreakdown } from "../../dashboards/model/breakdown/dashboard-defect-breakdown";
import { panelData } from "../../presentation/dashboard/charts/tests/support/panel-fixture";
import { workbenchFixture } from "../../dashboards/workbench/tests/fixtures/workbench-fixture";
import { defaultPreferences } from "../../dashboards/layout/preferences/preferences";
import { placeWidgets } from "../../dashboards/layout/model/layout";
import { createBoardWidget } from "../../dashboards/layout/model/widget-catalog";
import { workflowCatalog } from "../../dashboards/layout/migration/workflow-widgets";

export type PreviewMode = "slow" | "fast" | "failure" | "empty" | "legacy";
export const previewScope = { workspaceId: "workspace_dashboard_preview", projectId: "project_dashboard_preview" };
export function createDashboardLoadingFixture(mode: PreviewMode, log: (message: string) => void) {
  const data = fallbackBootstrap(); data.workspace = { id: previewScope.workspaceId, key: "QA", slug: "loading-preview", name: "Loading preview" };
  data.projects = [{ id: previewScope.projectId, key: "QA", name: "Dashboard QA", status: "active" }];
  data.meta.authorization = { role: "workspace_admin", capabilities: ["report:read", "report:manage"] };
  const selected = ["queue", "trend", "outcomes", "portfolio", "defectPerformance", "defects", "types", "passRate"];
  let widgets = mode === "empty" ? [] : placeWidgets(selected.map((key, index) =>
    createBoardWidget(workflowCatalog.find(definition => definition.key === key)!, "en", `widget_${index}`)));
  let preferences = { ...defaultPreferences, section: "all" as const };
  const at = "2026-11-12T10:00:00.000Z";
  const board = () => ({ id: "preview_board", ...previewScope, name: "Dashboard loading QA", description: "Local fixtures only", isDefault: true,
    status: "active", createdByIdentityId: "preview", widgets, createdAt: at, updatedAt: at });
  async function wait(name: string, delay: number, signal?: AbortSignal) {
    log(`Started: ${name}`); signal?.throwIfAborted();
    await new Promise<void>((resolve, reject) => {
      const aborted = () => { clearTimeout(timer); reject(new DOMException("Aborted", "AbortError")); };
      const timer = setTimeout(() => { signal?.removeEventListener("abort", aborted); resolve(); }, mode === "fast" ? 15 : delay);
      signal?.addEventListener("abort", aborted, { once: true });
    });
    signal?.throwIfAborted(); log(`Ready: ${name}`);
  }
  const breakdown = (): DashboardDefectBreakdown => ({ total: 5, groupCount: 2, truncated: false,
    period: { from: "2026-10-13T00:00:00.000Z", to: at }, periodApplied: true,
    groups: [{ key: "open", label: "Open", count: 3, segments: [{ key: "open", count: 3 }] },
      { key: "closed", label: "Closed", count: 2, segments: [{ key: "closed", count: 2 }] }] });
  const analytics: DashboardAnalyticsSource = {
    async summary(query, signal) {
      await wait("summary", 2200, signal);
      if (mode === "failure") throw new Error("Local preview: summary unavailable");
      return { ...panelData, query, generatedAt: new Date().toISOString(), trend: [0, 1, 2, 3, 4, 5, 6].map(index => ({
        day: `2026-11-${String(index + 1).padStart(2, "0")}`, start: `2026-11-0${index + 1}T00:00:00.000Z`, end: `2026-11-0${index + 2}T00:00:00.000Z`,
        launched: index % 3 + 1, passed: index % 2 + 1, failed: index % 3 === 0 ? 1 : 0, blocked: 0, incomplete: 0, not_started: 0, aborted: 0, passRate: 80 })) };
    },
    async drill(_request, signal) { await wait("drill", 800, signal); return { rows: [], total: 0 }; },
    async defectBreakdown(_request, signal) { await wait("nested defect breakdown", 1100, signal); return breakdown(); },
  };
  const meta = { nextCursor: null, hasMore: false, limit: 100 };
  const resource = async (path: string, signal?: AbortSignal) => {
    if (path.includes("dashboard-personal-view")) {
      const params = new URL(path, "https://preview.invalid").searchParams;
      const personalBoard = params.has("board");
      if (params.has("dashboardId")) {
        await wait("legacy personal positions", 4200, signal);
        return { etag: '"preview:1"', data: { kind: "layout", dashboardId: board().id, positions: [] } };
      }
      await wait(personalBoard ? "personal board" : "preferences", personalBoard ? 1350 : 750, signal);
      return { etag: '"preview:1"', data: personalBoard ? { kind: "board", rowVersion: 1, updatedAt: at, board: mode === "legacy" ? null : { name: board().name, widgets } }
        : { kind: "preferences", rowVersion: 1, updatedAt: at, preferences } };
    }
    if (path.startsWith("/dashboards/")) { await wait("team board", 300, signal); return { data: board(), etag: '"dashboard:1"' }; }
    throw new Error(`Unsupported local resource: ${path}`);
  };
  const http = {
    getResource: resource,
    async get(path: string, signal?: AbortSignal) {
      if (path.startsWith("/dashboards?")) { await wait("team catalog", 950, signal); return { data: [board()], meta }; }
      if (path.includes("/dashboard-analytics/workbench")) {
        await wait("workbench", 2400, signal);
        return { data: workbenchFixture({ ...previewScope, environmentId: "", buildReference: "", limit: 20 }) };
      }
      if (path.startsWith("/defects/triage")) { await wait("nested triage", 1200, signal); return { data: [], meta }; }
      if (path.startsWith("/dashboard-analytics/defect-lead-time")) {
        await wait("nested lead time", 1400, signal);
        return { data: [{ id: "lead_preview", projectId: previewScope.projectId, key: "QA-BUG-1", title: "Payment retry", priority: "high",
          archived: false, createdAt: "2026-11-01T00:00:00.000Z", resolvedAt: at, resolvedStatus: "closed", leadTimeDays: 11 }], meta };
      }
      throw new Error(`Unsupported local preview request: ${path}`);
    },
    async mutateResource(path: string, _method: string, body: { change?: components["schemas"]["DashboardPersonalViewPatch"]["change"] }) {
      if (!path.includes("dashboard-personal-view")) throw new Error("Preview writes are not allowed outside in-memory dashboard preferences.");
      if (body.change?.kind === "preferences") preferences = { ...preferences, ...body.change.patch } as typeof preferences;
      if (body.change?.kind === "board") widgets = body.change.widgets;
      return resource(path);
    },
  } as unknown as TmsHttpClient;
  return { data, analytics, http };
}
