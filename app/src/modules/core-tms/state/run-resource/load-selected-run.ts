import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { getRun, listRunItems } from "../../runs/data/run-api";

export async function loadSelectedRun(http: TmsHttpClient, projectId: string, runId: string,
  signal: AbortSignal) {
  signal.throwIfAborted();
  const run = await getRun(http, runId, signal);
  signal.throwIfAborted();
  if (run.data.id !== runId || run.data.projectId !== projectId) {
    throw new Error("Run selection does not match the requested project and resource");
  }
  const items = await listRunItems(http, runId, signal);
  signal.throwIfAborted();
  return { run, items: items.items };
}
