import type { components, paths } from "../../../../../../core/tms/generated/tms-api";
import { TmsApiError, type TmsHttpClient } from "../../../../../../core/tms/transport/http";
import type { BoardScope } from "../../model/layout";

type Api = components["schemas"];
export type PersonalView = Api["DashboardPersonalViewEnvelope"]["data"];
export type PersonalChange = Api["DashboardPersonalViewPatch"]["change"];
export type PersonalResource<V extends PersonalView> = { readonly data: V; readonly etag: string };
export interface PersonalViewSource<V extends PersonalView> {
  load(signal: AbortSignal): Promise<PersonalResource<V>>;
  save(change: PersonalChange, version: string, key: string, signal?: AbortSignal): Promise<PersonalResource<V>>;
}

export function personalViewSource<K extends PersonalView["kind"]>(http: TmsHttpClient, scope: BoardScope,
  kind: K, dashboardId?: string): PersonalViewSource<Extract<PersonalView, { kind: K }>> {
  type View = Extract<PersonalView, { kind: K }>;
  const path: keyof paths = "/projects/{projectId}/dashboard-personal-view";
  const query = new URLSearchParams({ workspaceId: scope.workspaceId });
  if (dashboardId) query.set("dashboardId", dashboardId);
  const url = `${path.replace("{projectId}", encodeURIComponent(scope.projectId))}?${query}`;
  function checked(data: PersonalView, etag: string | null): PersonalResource<View> {
    if (data?.kind !== kind || !etag || (data.kind === "layout" && data.dashboardId !== dashboardId)) {
      throw new Error("Unexpected dashboard personal view");
    }
    return { data: data as View, etag };
  }
  return {
    async load(signal) {
      const { data, etag } = await http.getResource<PersonalView>(url, signal);
      return checked(data, etag);
    },
    async save(change, ifMatch, idempotencyKey, signal) {
      const body: Api["DashboardPersonalViewPatch"] = { change };
      const { data, etag } = await http.mutateResource<PersonalView>(url, "PATCH", body,
        { ifMatch, idempotencyKey, signal });
      return checked(data, etag);
    },
  };
}

export const personalViewConflict = (error: unknown) => error instanceof TmsApiError && error.status === 412;
