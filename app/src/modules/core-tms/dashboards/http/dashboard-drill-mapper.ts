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
    id: item.id, key: item.key, title: item.title, project: project(projects, item.projectId),
    detail: [item.type, item.component, item.tags.map((tag) => `#${tag}`).join(" ")]
      .filter(Boolean).join(" · "),
    status: item.lifecycle, occurredAt: item.sortAt, links: [],
  })), envelope.meta);
}

export function mapRunDrill(envelope: Api["DashboardAnalyticsRunListEnvelope"],
  projects: Projects): DashboardDrillPage {
  return page(envelope.data.map((item) => ({
    id: item.id, key: item.key, title: item.name, project: project(projects, item.projectId),
    detail: `${item.type} · ${item.progress.total - item.progress.notRun}/${item.progress.total}`,
    status: item.basis === "completed" ? item.outcome : item.status,
    occurredAt: item.sortAt, links: [],
  })), envelope.meta);
}

export function mapRunItemDrill(envelope: Api["DashboardAnalyticsRunItemListEnvelope"],
  projects: Projects): DashboardDrillPage {
  return page(envelope.data.map((item) => ({
    id: `${item.runId}:${item.id}`, key: `${item.runKey} · ${item.testCaseKey}`,
    title: item.title, project: project(projects, item.projectId),
    detail: [item.runName, item.caseType, item.component, `#${item.attemptNo}`]
      .filter(Boolean).join(" · "),
    status: item.status, occurredAt: item.eventAt, links: [],
  })), envelope.meta, envelope.meta.total);
}

export function mapDefectDrill(envelope: Api["DashboardAnalyticsDefectListEnvelope"],
  projects: Projects): DashboardDrillPage {
  return page(envelope.data.map((item) => ({
    id: item.id, key: item.key, title: item.title, project: project(projects, item.projectId),
    detail: [item.severity, item.component].filter(Boolean).join(" · "),
    status: item.status, occurredAt: item.sortAt,
    links: item.links.map((link) => ({ label: link.label, url: link.url })),
  })), envelope.meta);
}
