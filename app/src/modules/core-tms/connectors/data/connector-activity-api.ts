import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import type { Scope, Provider, Snapshot, Delivery, Link } from "../model/connector-types";

export async function loadConnectorActivity(http: TmsHttpClient, scope: Scope, provider: Provider,
  signal: AbortSignal): Promise<Pick<Snapshot, "deliveries" | "links" | "nextCursor">> {
  signal.throwIfAborted();
  const path = `/integrations/connectors/${provider}`;
  const query = new URLSearchParams(scope);
  const [history, links] = await Promise.all([
    http.get<{ data: Delivery[]; nextCursor: string | null }>(`${path}/deliveries?${query}`, signal),
    http.get<{ data: Link[] }>(`${path}/links?${query}`, signal),
  ]);
  signal.throwIfAborted();
  return { deliveries: history.data, links: links.data, nextCursor: history.nextCursor };
}
