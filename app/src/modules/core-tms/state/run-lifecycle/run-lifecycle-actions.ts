import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import {
  archiveRun, restoreRun, retestRunItem, transitionRun,
} from "../../runs/data/run-api";

type KeyFactory = () => string;

export function createRunLifecycleActions(
  http: TmsHttpClient,
  createKey: KeyFactory = () => crypto.randomUUID(),
) {
  return Object.freeze({
    start(runId: string, etag: string, signal?: AbortSignal) {
      return transitionRun(http, runId, "start", etag, createKey(), undefined, signal);
    },
    abort(runId: string, etag: string, reason: string, signal?: AbortSignal) {
      return transitionRun(http, runId, "abort", etag, createKey(), { reason }, signal);
    },
    retest(runId: string, itemId: string, etag: string, signal?: AbortSignal) {
      return retestRunItem(http, runId, itemId, etag, createKey(), signal);
    },
    archive(runId: string, etag: string, reason?: string, signal?: AbortSignal) {
      return archiveRun(http, runId, etag, createKey(), reason, signal);
    },
    restore(runId: string, etag: string, signal?: AbortSignal) {
      return restoreRun(http, runId, etag, createKey(), signal);
    },
  });
}
