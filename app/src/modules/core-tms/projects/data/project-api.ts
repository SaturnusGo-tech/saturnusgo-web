import type { components } from "../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { mapProject } from "./project-mapper";

type Api = components["schemas"];

export async function getProject(http: TmsHttpClient, projectId: string, signal?: AbortSignal) {
  const resource = await http.getResource<Api["Project"]>(`/projects/${projectId}`, signal);
  return { data: mapProject(resource.data), etag: resource.etag };
}

export async function createProjectResource(
  http: TmsHttpClient,
  body: Api["ProjectCreateRequest"],
  idempotencyKey: string,
) {
  const resource = await http.mutateResource<Api["Project"]>(
    "/projects",
    "POST",
    body,
    { idempotencyKey },
  );
  return { data: mapProject(resource.data), etag: resource.etag };
}

export async function updateProjectResource(
  http: TmsHttpClient,
  projectId: string,
  body: Api["ProjectPatchRequest"],
  etag: string,
  idempotencyKey: string,
) {
  const resource = await http.mutateResource<Api["Project"]>(
    `/projects/${projectId}`, "PATCH", body, { ifMatch: etag, idempotencyKey },
  );
  return { data: mapProject(resource.data), etag: resource.etag };
}

export async function transitionProjectResource(
  http: TmsHttpClient,
  projectId: string,
  operation: "archive" | "restore",
  etag: string,
  idempotencyKey: string,
) {
  const path = operation === "restore" ? `/projects/${projectId}/restore` : `/projects/${projectId}`;
  const method = operation === "restore" ? "POST" : "DELETE";
  const resource = await http.mutateResource<Api["Project"]>(
    path, method, undefined, { ifMatch: etag, idempotencyKey },
  );
  return { data: mapProject(resource.data), etag: resource.etag };
}
