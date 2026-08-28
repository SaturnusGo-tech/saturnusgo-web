import type { components } from "../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { mapDefect } from "./defect-mapper";

type Api = components["schemas"];

export async function listDefects(http: TmsHttpClient, projectId: string, signal?: AbortSignal) {
  const query = new URLSearchParams({ projectId, limit: "100" });
  const envelope = await http.get<Api["DefectListEnvelope"]>(`/defects?${query}`, signal);
  return { items: envelope.data.map(mapDefect), meta: envelope.meta };
}

export async function createDefectResource(
  http: TmsHttpClient,
  body: Api["DefectCreateRequest"],
  idempotencyKey: string,
) {
  const resource = await http.mutateResource<Api["Defect"]>(
    "/defects", "POST", body, { idempotencyKey },
  );
  return { data: mapDefect(resource.data), etag: resource.etag };
}

export async function getDefect(
  http: TmsHttpClient,
  defectId: string,
  signal?: AbortSignal,
) {
  const resource = await http.getResource<Api["Defect"]>(`/defects/${defectId}`, signal);
  return { data: mapDefect(resource.data), etag: resource.etag };
}
