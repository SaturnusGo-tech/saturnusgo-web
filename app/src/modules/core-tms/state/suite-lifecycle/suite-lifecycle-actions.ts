import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { transitionSuite } from "../../suites/data/suite-api";

type KeyFactory = () => string;

export function createSuiteLifecycleActions(
  http: TmsHttpClient,
  createKey: KeyFactory = () => crypto.randomUUID(),
) {
  return Object.freeze({
    archive(suiteId: string, etag: string, signal?: AbortSignal) {
      return transitionSuite(http, suiteId, "archive", etag, createKey(), signal);
    },
    restore(suiteId: string, etag: string, signal?: AbortSignal) {
      return transitionSuite(http, suiteId, "restore", etag, createKey(), signal);
    },
  });
}
