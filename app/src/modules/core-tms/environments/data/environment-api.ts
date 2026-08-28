import type { components } from "../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { mapEnvironment } from "./environment-mapper";

type Api = components["schemas"];

export async function listEnvironments(
  http: TmsHttpClient,
  projectId: string,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({ projectId, limit: "100" });
  const envelope = await http.get<Api["EnvironmentListEnvelope"]>(
    `/environments?${query}`,
    signal,
  );
  return { items: envelope.data.map(mapEnvironment), meta: envelope.meta };
}

export async function getEnvironment(http: TmsHttpClient, environmentId: string, signal?: AbortSignal) {
  const resource = await http.getResource<Api["Environment"]>(`/environments/${environmentId}`, signal);
  return { data: mapEnvironment(resource.data), etag: resource.etag };
}

export async function createEnvironmentResource(
  http: TmsHttpClient,
  body: Api["EnvironmentCreateRequest"],
  idempotencyKey: string,
) {
  const resource = await http.mutateResource<Api["Environment"]>(
    "/environments",
    "POST",
    body,
    { idempotencyKey },
  );
  return { data: mapEnvironment(resource.data), etag: resource.etag };
}

export async function updateEnvironmentResource(
  http: TmsHttpClient,
  environmentId: string,
  body: Api["EnvironmentPatchRequest"],
  etag: string,
  idempotencyKey: string,
) {
  const resource = await http.mutateResource<Api["Environment"]>(
    `/environments/${environmentId}`, "PATCH", body, { ifMatch: etag, idempotencyKey },
  );
  return { data: mapEnvironment(resource.data), etag: resource.etag };
}

export async function transitionEnvironmentResource(
  http: TmsHttpClient,
  environmentId: string,
  operation: "archive" | "restore",
  etag: string,
  idempotencyKey: string,
) {
  const path = operation === "restore"
    ? `/environments/${environmentId}/restore`
    : `/environments/${environmentId}`;
  const method = operation === "restore" ? "POST" : "DELETE";
  const resource = await http.mutateResource<Api["Environment"]>(
    path, method, undefined, { ifMatch: etag, idempotencyKey },
  );
  return { data: mapEnvironment(resource.data), etag: resource.etag };
}
