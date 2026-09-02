import type { Bootstrap, Defect, TestRunSummary } from "../../../../core/tms/contracts/legacy-contract";
import type {
  DashboardAnalyticsQuery, DashboardAnalyticsSource, DashboardDrillPage,
  DashboardDrillRequest, DashboardDrillRow, DashboardRunOutcome,
} from "../model/dashboard-analytics";
import { createDashboardSnapshot } from "../model/bootstrap-dashboard-snapshot";

const time = (value: string | null | undefined) => value ? Date.parse(value) : 0;
const outcome = (run: TestRunSummary): DashboardRunOutcome | null => {
  if (run.status === "aborted") return "aborted";
  if (run.status === "draft" || run.progress.total === 0) return "not_started";
  if (run.status !== "completed") return "incomplete";
  if (run.progress.counts.failed > 0) return "failed";
  if (run.progress.counts.blocked > 0) return "blocked";
  if (run.progress.counts.passed === run.progress.total) return "passed";
  return "incomplete";
};

function range(data: Bootstrap, request: DashboardDrillRequest) {
  if (request.drill.window) return {
    start: Date.parse(request.drill.window.from), end: Date.parse(request.drill.window.to),
  };
  const start = new Date(data.meta.generatedAt);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - Number(request.query.period.slice(0, -1)) + 1);
  return { start: start.getTime(), end: Date.parse(data.meta.generatedAt) + 1 };
}

function defectLinks(data: Bootstrap, defect: Defect) {
  const links = data.externalLinks
    .filter((item) => item.owner.kind === "defect" && item.owner.defectId === defect.id && item.status === "active")
    .map((item) => ({ label: item.label, url: item.targetUri }));
  if (defect.externalIssue && defect.externalIssue.syncStatus !== "deleted" && !links.some((item) => item.url === defect.externalIssue?.url)) {
    links.unshift({ label: defect.externalIssue.key, url: defect.externalIssue.url });
  }
  return links;
}

function paginate(rows: DashboardDrillRow[], request: DashboardDrillRequest): DashboardDrillPage {
  const limit = Math.min(Math.max(request.limit ?? 25, 1), 100);
  const scope = encodeURIComponent(JSON.stringify([
    request.query.workspaceId,
    request.drill.projectId ?? request.query.projectId ?? null,
    request.query.period,
    request.drill.window ?? null,
    request.drill.filter,
  ]));
  const prefix = `local:${scope}:`;
  if (request.cursor && !request.cursor.startsWith(prefix)) throw new TypeError("Dashboard cursor scope mismatch.");
  const offset = request.cursor?.slice(prefix.length);
  if (offset && !/^\d+$/.test(offset)) throw new TypeError("Invalid dashboard cursor.");
  const start = offset ? Number(offset) : 0;
  const page = rows.slice(start, start + limit);
  const next = start + page.length;
  return { rows: page, total: rows.length, ...(next < rows.length ? { nextCursor: `${prefix}${next}` } : {}) };
}

export function createBootstrapDashboardAnalyticsSource(data: Bootstrap): DashboardAnalyticsSource {
  const projects = new Map(data.projects.map((project) => [project.id, project.name]));
  const projectLabel = (id: string) => projects.get(id) ?? id;

  return Object.freeze({
    async summary(query: DashboardAnalyticsQuery, signal?: AbortSignal) {
      signal?.throwIfAborted();
      return createDashboardSnapshot(data, query);
    },
    async drill(request: DashboardDrillRequest, signal?: AbortSignal) {
      signal?.throwIfAborted();
      const { filter } = request.drill;
      const projectId = request.drill.projectId ?? request.query.projectId;
      const window = range(data, request);
      const inWindow = (value: string | null | undefined) => {
        const occurredAt = time(value);
        return occurredAt >= window.start && occurredAt < window.end;
      };
      const inProject = <T extends { projectId: string }>(item: T) => !projectId || item.projectId === projectId;
      let rows: DashboardDrillRow[] = [];

      if (filter.entity === "test_case") {
        rows = data.testCases.filter(inProject).filter((item) => {
          if (filter.basis === "current" && item.archivedAt) return false;
          if (filter.basis === "created" && !inWindow(item.createdAt)) return false;
          if (filter.type && item.type !== filter.type) return false;
          if (filter.tag && !item.tags.includes(filter.tag)) return false;
          if (filter.untagged && item.tags.length > 0) return false;
          if (filter.component !== undefined && item.component !== filter.component) return false;
          if (filter.componentIsEmpty && item.component.trim() !== "") return false;
          return filter.coverage === undefined;
        }).map((item) => ({
          id: item.id, entity: "test_case" as const, projectId: item.projectId,
          key: item.key, title: item.title, project: projectLabel(item.projectId),
          detail: item.tags.map((tag) => `#${tag}`).join(" "), type: item.type,
          component: item.component, priority: item.priority, tags: item.tags,
          status: item.lifecycle, occurredAt: filter.basis === "created" ? item.createdAt : item.updatedAt,
          links: data.externalLinks.filter((link) => link.owner.kind === "test_case" && link.owner.caseId === item.id && link.status === "active")
            .map((link) => ({ label: link.label, url: link.targetUri })),
        }));
      } else if (filter.entity === "run") {
        rows = data.runs.filter(inProject).filter((run) => {
          const occurredAt = filter.basis === "launched" ? run.startedAt
            : filter.basis === "completed" ? run.completedAt ?? (run.status === "aborted" ? run.startedAt : null)
              : run.createdAt;
          if (filter.basis === "active" ? run.status !== "active" : !inWindow(occurredAt)) return false;
          if (filter.status && run.status !== filter.status) return false;
          if (filter.outcome && outcome(run) !== filter.outcome) return false;
          if (filter.component !== undefined || filter.componentIsEmpty) return false;
          return !filter.itemStatus || run.progress.counts[filter.itemStatus] > 0;
        }).map((run) => ({
          id: run.id, entity: "run" as const, projectId: run.projectId,
          key: run.key, title: run.name, project: projectLabel(run.projectId),
          detail: `${run.environment.name} · ${run.progress.executed}/${run.progress.total}`,
          type: run.type,
          status: filter.outcome ? outcome(run) ?? run.status : run.status,
          occurredAt: filter.basis === "launched" ? run.startedAt ?? run.createdAt : run.completedAt ?? run.startedAt ?? run.createdAt,
          links: data.externalLinks.filter((link) => link.owner.kind === "run" && link.owner.runId === run.id && link.status === "active")
            .map((link) => ({ label: link.label, url: link.targetUri })),
        }));
      } else if (filter.entity === "run_item") {
        rows = [];
      } else {
        rows = data.defects.filter(inProject).filter((defect) => {
          if (filter.basis === "reported" && !inWindow(defect.createdAt)) return false;
          if (filter.status && defect.status !== filter.status) return false;
          if (filter.component !== undefined && defect.component !== filter.component) return false;
          if (filter.componentIsEmpty && defect.component.trim() !== "") return false;
          if (filter.severity && defect.severity !== filter.severity) return false;
          if (filter.activeOnly && ["verified", "closed"].includes(defect.status)) return false;
          if (filter.runId && defect.runId !== filter.runId) return false;
          if (filter.testCaseId) return false;
          const linked = defectLinks(data, defect).length > 0;
          return filter.hasLink === undefined || filter.hasLink === linked;
        }).map((defect) => ({
          id: defect.id, entity: "defect" as const, projectId: defect.projectId,
          key: defect.key, title: defect.title, project: projectLabel(defect.projectId),
          detail: "", component: defect.component, priority: defect.priority, status: defect.status,
          occurredAt: defect.createdAt, links: defectLinks(data, defect),
        }));
      }
      rows.sort((a, b) => time(b.occurredAt) - time(a.occurredAt) || a.key.localeCompare(b.key));
      signal?.throwIfAborted();
      return paginate(rows, request);
    },
  });
}
