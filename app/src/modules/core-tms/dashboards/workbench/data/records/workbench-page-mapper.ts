import type { components } from "../../../../../../core/tms/generated/tms-api";
import type { WorkbenchPage, WorkbenchRecordsQuery } from "../../model/workbench";
import { WorkbenchReadError } from "../../model/workbench-error";
import { mapWorkbenchQueue } from "../workbench-mapper";

export function mapWorkbenchPage(envelope: components["schemas"]["DashboardWorkbenchRecordPageEnvelope"],
  query: WorkbenchRecordsQuery): WorkbenchPage {
  const { data, meta } = envelope;
  if (data.workspaceId !== query.workspaceId || data.projectId !== (query.projectId ?? null) ||
    data.kind !== query.kind || data.filters.environmentId !== (query.environmentId || null) ||
    data.filters.buildReference !== (query.buildReference || null) ||
    !Number.isFinite(Date.parse(data.generatedAt)) || !Number.isFinite(Date.parse(data.asOf)) ||
    meta.limit !== query.limit || meta.hasMore !== Boolean(meta.nextCursor) ||
    (meta.hasMore && (!data.items.length || meta.nextCursor === query.cursor))) {
    throw new WorkbenchReadError({ kind: "error", requestId: null });
  }
  return {
    queue: mapWorkbenchQueue(query.kind, { items: data.items, total: data.total, truncated: meta.hasMore }, query),
    generatedAt: data.generatedAt, asOf: data.asOf, nextCursor: meta.nextCursor,
  };
}
