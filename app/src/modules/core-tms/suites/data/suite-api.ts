import type { components } from "../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { mapSuite, mapSuiteSummary } from "./suite-mapper";

type Api = components["schemas"];

export async function listSuites(http: TmsHttpClient, projectId: string, signal?: AbortSignal) {
  const query = new URLSearchParams({ projectId, limit: "100" });
  const envelope = await http.get<Api["SuiteListEnvelope"]>(`/suites?${query}`, signal);
  return { items: envelope.data.map(mapSuiteSummary), meta: envelope.meta };
}

export async function getSuite(http: TmsHttpClient, suiteId: string, signal?: AbortSignal) {
  const resource = await http.getResource<Api["Suite"]>(`/suites/${suiteId}`, signal);
  return { data: mapSuite(resource.data), etag: resource.etag };
}

export async function createSuite(
  http: TmsHttpClient,
  body: Api["SuiteCreateRequest"],
  idempotencyKey: string,
) {
  const resource = await http.mutateResource<Api["Suite"]>(
    "/suites", "POST", body, { idempotencyKey },
  );
  return { data: mapSuite(resource.data), etag: resource.etag };
}

export async function updateSuite(
  http: TmsHttpClient,
  suiteId: string,
  body: Api["SuitePatchRequest"],
  etag: string,
  idempotencyKey: string,
) {
  const resource = await http.mutateResource<Api["Suite"]>(
    `/suites/${suiteId}`, "PATCH", body, { ifMatch: etag, idempotencyKey },
  );
  return { data: mapSuite(resource.data), etag: resource.etag };
}

export async function transitionSuite(
  http: TmsHttpClient,
  suiteId: string,
  operation: "archive" | "restore",
  etag: string,
  idempotencyKey: string,
  signal?: AbortSignal,
) {
  const path = operation === "restore" ? `/suites/${suiteId}/restore` : `/suites/${suiteId}`;
  const method = operation === "restore" ? "POST" : "DELETE";
  const resource = await http.mutateResource<Api["Suite"]>(
    path, method, undefined, { ifMatch: etag, idempotencyKey, signal },
  );
  return { data: mapSuite(resource.data), etag: resource.etag };
}
