import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import {
  getRunAttempt,
  listRunAttempts,
  type RunHistoryPageRequest,
} from "../../runs/data/run-api";
import {
  getCaseRevision,
  listCaseRevisions,
  type RevisionPageRequest,
} from "../../test-cases/data/test-case-api";

export function createRunHistoryResource(http: TmsHttpClient) {
  return Object.freeze({
    listAttempts(runId: string, itemId: string, request?: RunHistoryPageRequest) {
      return listRunAttempts(http, runId, itemId, request);
    },
    getAttempt(runId: string, itemId: string, attemptNo: number, signal?: AbortSignal) {
      return getRunAttempt(http, runId, itemId, attemptNo, signal);
    },
    listRevisions(caseId: string, request?: RevisionPageRequest) {
      return listCaseRevisions(http, caseId, request);
    },
    getRevision(caseId: string, revision: number, signal?: AbortSignal) {
      return getCaseRevision(http, caseId, revision, signal);
    },
  });
}
