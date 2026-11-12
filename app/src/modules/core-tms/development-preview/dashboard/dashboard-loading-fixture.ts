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
import type { TmsLocale } from "../../localization/model/locale";
import { createTriageRows } from "./fixtures/triage-fixture";

export type PreviewMode = "triage" | "slow" | "fast" | "failure" | "empty" | "legacy";
export const previewScope = { workspaceId: "workspace_dashboard_preview", projectId: "project_dashboard_preview" };
export function createDashboardLoadingFixture(mode: PreviewMode, log: (message: string) => void, locale: TmsLocale = "en") {
  const ru = locale === "ru";
  const data = fallbackBootstrap(); data.workspace = { id: previewScope.workspaceId, key: "QA", slug: "loading-preview", name: "Umbrella Home · preview" };
  data.projects = [{ id: previewScope.projectId, key: "QA", name: ru ? "Бронирования и платежи" : "Bookings and payments", status: "active" }];
  data.meta.authorization = { role: "workspace_admin", capabilities: ["report:read", "report:manage", "defect:read", "defect:manage"] };
  const selected = mode === "triage" ? ["queue"] : ["queue", "trend", "outcomes", "portfolio", "defectPerformance", "defects", "types", "passRate"];
  let widgets = mode === "empty" ? [] : placeWidgets(selected.map((key, index) =>
    createBoardWidget(workflowCatalog.find(definition => definition.key === key)!, locale, `widget_${index}`)));
  let preferences = { ...defaultPreferences, section: "all" as const };
  const at = "2026-11-12T10:00:00.000Z";
  const triageRows = new Map(createTriageRows(locale, previewScope.projectId).map(row => [row.id, row]));
  const removedFromTriage = new Set<string>();
  const members: components["schemas"]["CatalogActor"][] = [
    { identityId: "preview_maya", kind: "human", name: "Maya Chen", email: "maya@example.invalid", role: "qa_manager", presence: "online" },
    { identityId: "preview_alex", kind: "human", name: "Alex Morgan", email: "alex@example.invalid", role: "tester", presence: "offline" },
    { identityId: "preview_priya", kind: "human", name: "Priya Shah", email: "priya@example.invalid", role: "tester", presence: "online" },
    { identityId: "preview_codex", kind: "agent", provider: "codex", name: "Codex", status: "active" },
  ];
  const board = () => ({ id: "preview_board", ...previewScope, name: ru ? "Работа команды QA" : "QA team workspace", description: "Local fixtures only", isDefault: true,
    status: "active", createdByIdentityId: "preview", widgets, createdAt: at, updatedAt: at });
  async function wait(name: string, delay: number, signal?: AbortSignal) {
    log(`Started: ${name}`); signal?.throwIfAborted();
    await new Promise<void>((resolve, reject) => {
      const aborted = () => { clearTimeout(timer); reject(new DOMException("Aborted", "AbortError")); };
      const timer = setTimeout(() => { signal?.removeEventListener("abort", aborted); resolve(); }, mode === "fast" || mode === "triage" ? 15 : delay);
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
    if (/^\/company\/members\/[^/]+\/avatar$/.test(path)) return { data: null };
    if (/^\/defects\/[^/?]+$/.test(path)) {
      const row = triageRows.get(decodeURIComponent(path.split("/")[2]));
      if (!row) throw new Error("Local defect does not exist.");
      return { data: row, etag: `"defect:${row.rowVersion}"` };
    }
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
      const params = new URL(path, "https://preview.invalid").searchParams;
      if (path.startsWith(`/workspaces/${previewScope.workspaceId}/actors?`)) {
        const identityId = params.get("identityId");
        return { data: members.filter(member => !identityId || member.identityId === identityId), meta };
      }
      if (path.startsWith("/dashboards?")) { await wait("team catalog", 950, signal); return { data: [board()], meta }; }
      if (path.includes("/dashboard-analytics/workbench")) {
        await wait("workbench", 2400, signal);
        const query = { ...previewScope, environmentId: params.get("environmentId") ?? "", buildReference: params.get("buildReference") ?? "", limit: Number(params.get("limit") ?? 20) };
        const workbench = createQaWorkbench(query, locale);
        if (path.includes("/workbench/records?")) {
          const kind = params.get("kind") as keyof Pick<typeof workbench, "activeRuns" | "readyForRetest" | "blockedItems" | "outdatedItems" | "runsWithoutBuild">;
          const queue = workbench[kind];
          if (!queue) throw new Error("Unsupported local QA queue.");
          return { data: { ...query, projectId: query.projectId, kind, generatedAt: workbench.generatedAt, asOf: workbench.asOf,
            filters: workbench.filters, items: queue.items, total: queue.total }, meta: { ...meta, limit: query.limit } };
        }
        return { data: workbench };
      }
      if (path.startsWith("/defects/triage?")) {
        await wait("nested triage", 1200, signal);
        const snoozed = params.get("view") === "snoozed";
        return { data: mode === "empty" ? [] : [...triageRows.values()].filter(row => !removedFromTriage.has(row.id) && Boolean(row.triageSnoozedUntil) === snoozed), meta };
      }
      if (path.startsWith("/defects?")) {
        const search = (params.get("q") ?? "").toLocaleLowerCase();
        return { data: [...triageRows.values()].filter(row => `${row.key} ${row.title}`.toLocaleLowerCase().includes(search)), meta };
      }
      if (path.startsWith("/dashboard-analytics/defect-lead-time")) {
        await wait("nested lead time", 1400, signal);
        return { data: [{ id: "lead_preview", projectId: previewScope.projectId, key: "QA-BUG-1", title: "Payment retry", priority: "high",
          archived: false, createdAt: "2026-11-01T00:00:00.000Z", resolvedAt: at, resolvedStatus: "closed", leadTimeDays: 11 }], meta };
      }
      throw new Error(`Unsupported local preview request: ${path}`);
    },
    async mutateResource(path: string, _method: string, body: { change?: components["schemas"]["DashboardPersonalViewPatch"]["change"] } & Partial<components["schemas"]["DefectTriageRequest"]>) {
      if (/^\/defects\/[^/]+\/triage$/.test(path)) {
        await wait("local triage decision", 250);
        const id = decodeURIComponent(path.split("/")[2]), row = triageRows.get(id);
        if (!row || row.rowVersion !== body.expectedVersion || body.projectId !== previewScope.projectId || body.workspaceId !== previewScope.workspaceId) {
          throw new Error("Local triage version or scope changed. Reset the fixture to continue.");
        }
        const next = { ...row, rowVersion: row.rowVersion + 1, updatedAt: new Date().toISOString() };
        if (body.action === "snooze") {
          if (!body.snoozedUntil) throw new Error("Choose a local snooze date.");
          next.triageSnoozedUntil = body.snoozedUntil;
        }
        else if (body.action === "resume") next.triageSnoozedUntil = null;
        else {
          next.status = body.action === "accept" ? "triaged" : "closed";
          if (body.action === "duplicate") {
            if (!body.duplicateOfDefectId || !triageRows.has(body.duplicateOfDefectId) || body.duplicateOfDefectId === id) throw new Error("Choose another local defect.");
            next.triageDuplicateOfDefectId = body.duplicateOfDefectId;
          }
          removedFromTriage.add(id);
        }
        triageRows.set(id, next); log(`Memory only: ${body.action} ${row.key}`);
        return { data: next, etag: `"defect:${next.rowVersion}"` };
      }
      if (!path.includes("dashboard-personal-view")) throw new Error("Preview writes are not allowed outside in-memory dashboard preferences.");
      if (body.change?.kind === "preferences") preferences = { ...preferences, ...body.change.patch } as typeof preferences;
      if (body.change?.kind === "board") widgets = body.change.widgets;
      return resource(path);
    },
  } as unknown as TmsHttpClient;
  return { data, analytics, http };
}

function createQaWorkbench(query: Parameters<typeof workbenchFixture>[0], locale: TmsLocale) {
  const value = workbenchFixture(query), ru = locale === "ru", now = new Date().toISOString();
  const scope = { projectName: ru ? "Бронирования и платежи" : "Bookings and payments", updatedAt: now };
  const run = { ...value.activeRuns.items[0], ...scope, id: "preview_run_regression", key: "QA-TR-42",
    name: ru ? "Регрессия бронирований · Staging" : "Booking regression · Staging" };
  const retest = [
    ru ? "Повторный запрос не создаёт второй платёж" : "Repeated request does not create a second payment",
    ru ? "Отмена брони освобождает даты в календаре" : "Cancelling a booking releases its calendar dates",
    ru ? "Сумма возврата учитывает ранее удержанный сбор" : "Refund total accounts for the previously retained fee",
  ].map((title, index) => ({ ...value.readyForRetest.items[0], ...scope, id: `preview_retest_${index}`,
    key: `QA-BUG-${160 - index}`, title, occurrence: { ...value.readyForRetest.items[0].occurrence!, runId: run.id } }));
  const items = [
    ru ? "Оплата брони с сохранённой картой" : "Pay for a booking with a saved card",
    ru ? "Перенос подтверждённой брони" : "Reschedule a confirmed booking",
    ru ? "Уведомление гостю после изменения дат" : "Notify the guest after changing booking dates",
  ].map((title, index) => ({ ...value.blockedItems.items[0], ...scope, id: `preview_qa_item_${index}`, runId: run.id,
    runKey: run.key, runName: run.name, caseKey: `QA-TC-${240 + index}`, testCaseId: `preview_case_${index}`, title }));
  value.generatedAt = now; value.asOf = now;
  value.activeRuns = { items: [run], total: 1, truncated: false };
  value.readyForRetest = { items: retest, total: retest.length, truncated: false };
  value.openDefects = { items: retest, total: retest.length, truncated: false };
  value.blockedItems = { items: items.slice(0, 2), total: 2, truncated: false };
  value.outdatedItems = { items: items.slice(1).map(item => ({ ...item, status: "passed" as const })), total: 2, truncated: false };
  value.runsWithoutBuild = query?.buildReference ? { items: [], total: 0, truncated: false }
    : { items: [{ ...run, id: "preview_run_without_build", key: "QA-TR-43", buildReference: "",
      name: ru ? "Регрессия уведомлений" : "Notification regression" }], total: 1, truncated: false };
  value.counts = { activeRuns: 1, readyForRetest: 3, blockedActiveItems: 2, openDefects: 3 };
  value.freshness = { ...value.freshness, outdatedActiveItems: 2, activeRunsWithoutBuild: value.runsWithoutBuild.total };
  return value;
}
