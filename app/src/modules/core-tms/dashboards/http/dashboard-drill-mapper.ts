import type { components } from "../../../../core/tms/generated/tms-api";
import type { DashboardDrillPage, DashboardDrillRow } from "../model/dashboard-analytics";

type Api = components["schemas"];
type Projects = ReadonlyMap<string, string>;

const project = (projects: Projects, id: string) => projects.get(id) ?? id;
const page = (rows: DashboardDrillRow[], meta: Api["AnalyticsPageMeta"], total?: number): DashboardDrillPage => ({
  rows, ...(meta.nextCursor ? { nextCursor: meta.nextCursor } : {}),
  ...(total === undefined ? {} : { total }),
});

export function mapTestCaseDrill(envelope: Api["DashboardAnalyticsTestCaseListEnvelope"],
  projects: Projects): DashboardDrillPage {
  return page(envelope.data.map((item) => ({
    id: item.id, entity: "test_case" as const, projectId: item.projectId,
    key: item.key, title: item.title, project: project(projects, item.projectId),
    detail: item.tags.map((tag) => `#${tag}`).join(" "), type: item.type,
    component: item.component, priority: item.priority, tags: item.tags,
    status: item.lifecycle, occurredAt: item.sortAt, links: [],
  })), envelope.meta);
}

export function mapRunDrill(envelope: Api["DashboardAnalyticsRunListEnvelope"],
  projects: Projects): DashboardDrillPage {
  return page(envelope.data.map((item) => ({
    id: item.id, entity: "run" as const, projectId: item.projectId,
    key: item.key, title: item.name, project: project(projects, item.projectId),
    detail: `${item.type} · ${item.progress.total - item.progress.notRun}/${item.progress.total}`,
    type: item.type,
    status: item.basis === "completed" ? item.outcome : item.status,
    occurredAt: item.sortAt, links: [],
  })), envelope.meta);
}

export function mapRunItemDrill(envelope: Api["DashboardAnalyticsRunItemListEnvelope"],
  projects: Projects): DashboardDrillPage {
  return page(envelope.data.map((item) => ({
    id: `${item.runId}:${item.id}`, entity: "run_item" as const,
    projectId: item.projectId, runId: item.runId, runItemId: item.id,
    key: `${item.runKey} · ${item.testCaseKey}`,
    title: item.title, project: project(projects, item.projectId),
    detail: [item.runName, `#${item.attemptNo}`]
      .filter(Boolean).join(" · "),
    type: item.caseType, component: item.component ?? undefined,
    status: item.status, occurredAt: item.eventAt, links: [],
  })), envelope.meta, envelope.meta.total);
}

export function mapDefectDrill(envelope: Api["DashboardAnalyticsDefectListEnvelope"],
  projects: Projects): DashboardDrillPage {
  return page(envelope.data.map((item) => ({
    id: item.id, entity: "defect" as const, projectId: item.projectId,
    key: item.key, title: item.title, project: project(projects, item.projectId),
    detail: "", component: item.component, priority: item.priority,
    status: item.status, occurredAt: item.sortAt,
    links: item.links.map((link) => ({ label: link.label, url: link.url })),
  })), envelope.meta);
}
