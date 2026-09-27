import type { components } from "../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import { mapRun } from "../../data/run-mapper";
import type { RunEditPort, RunEditResource } from "../model/run-edit";

export function runEditApi(http: TmsHttpClient): RunEditPort {
  function resource(value: { data: components["schemas"]["Run"]; etag: string | null }, runId: string): RunEditResource {
    if (!value.etag || value.data.id !== runId) throw new Error("The run response cannot be edited safely.");
    return { data: mapRun(value.data), etag: value.etag };
  }
  return {
    async load(runId, signal) { return resource(await http.getResource(`/runs/${encodeURIComponent(runId)}`, signal), runId); },
    async save(runId, patch, etag, key) {
      // A stale version is returned to the editor. Never reload and overwrite automatically.
      return resource(await http.mutateResource(`/runs/${encodeURIComponent(runId)}`, "PATCH", patch,
        { ifMatch: etag, idempotencyKey: key }), runId);
    },
  };
}
