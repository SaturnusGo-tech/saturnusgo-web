import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import type { Connection, ConnectionInput, Scope, Provider, Discovery, Catalog,
  Delivery, Link, Webhook, Snapshot, ReportRepublish } from "../model/connector-types";
import { loadConnectorActivity } from "./connector-activity-api";
const base = "/integrations/connectors";
const path = (scope: Scope, provider: Provider, suffix: string) =>
  `${base}/${provider}/${suffix}?${new URLSearchParams(scope)}`;
export const connectorApi = (http: TmsHttpClient) => ({
  async targetLinks(scope: Scope, targetId: string, signal: AbortSignal): Promise<Link[]> {
    return (await http.get<{ data: Link[] }>(`${base}/targets/${encodeURIComponent(targetId)}/links?${new URLSearchParams(scope)}`, signal)).data;
  },
  async list(workspaceId: string, signal?: AbortSignal): Promise<Connection[]> {
    return (await http.get<{ data: Connection[] }>(`${base}?${new URLSearchParams({ workspaceId })}`, signal)).data;
  },
  async load(scope: Scope, provider: Provider, signal: AbortSignal): Promise<Snapshot> {
    signal.throwIfAborted();
    const [configuration, catalog, activity, webhook] = await Promise.all([
      http.getResource<Connection | null>(path(scope, provider, "configuration"), signal),
      http.get<{ data: Catalog }>(`${base}/catalog?${new URLSearchParams(scope)}`, signal),
      loadConnectorActivity(http, scope, provider, signal),
      http.get<{ data: Webhook }>(path(scope, provider, "webhook-setup"), signal),
    ]);
    return { connection: configuration.data, etag: configuration.etag, catalog: catalog.data,
      ...activity, webhook: webhook.data };
  },
  activity: (scope: Scope, provider: Provider, signal: AbortSignal) =>
    loadConnectorActivity(http, scope, provider, signal),
  discover: (scope: Scope, provider: Provider, input: ConnectionInput, signal: AbortSignal) =>
    http.mutate<Discovery>(path(scope, provider, "discovery"), "POST", input, signal),
  save: (scope: Scope, provider: Provider, input: ConnectionInput, etag: string, signal: AbortSignal) =>
    http.mutateResource<Connection>(path(scope, provider, "configuration"), "PATCH", input, { ifMatch: etag, signal }),
  disconnect: (scope: Scope, provider: Provider, etag: string, signal: AbortSignal) =>
    http.mutateResource<null>(path(scope, provider, "disconnect"), "POST", undefined, { ifMatch: etag, signal }),
  retry: (scope: Scope, provider: Provider, id: string, signal: AbortSignal) =>
    http.mutate(path(scope, provider, `deliveries/${encodeURIComponent(id)}/retry`), "POST", undefined, signal),
  republishReport: (scope: Scope, runId: string, etag: string, idempotencyKey: string, signal: AbortSignal) =>
    http.mutateResource<ReportRepublish>(path(scope, "confluence", `reports/${encodeURIComponent(runId)}/republish`),
      "POST", undefined, { ifMatch: etag, idempotencyKey, signal }),
  reconcile: (scope: Scope, provider: Provider, id: string, remoteId: string, signal: AbortSignal) =>
    http.mutate(path(scope, provider, `deliveries/${encodeURIComponent(id)}/reconcile`), "POST", { remoteId }, signal),
  history: (scope: Scope, provider: Provider, before: string, signal: AbortSignal) =>
    http.get<{ data: Delivery[]; nextCursor: string | null }>(`${path(scope, provider, "deliveries")}&before=${encodeURIComponent(before)}`, signal),
});
