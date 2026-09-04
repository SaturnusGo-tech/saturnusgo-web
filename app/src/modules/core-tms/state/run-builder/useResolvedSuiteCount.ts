import { useEffect, useState } from "react";
import type { Suite, SuiteSummary } from "../../../../core/tms/contracts/legacy-contract";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { getSuite } from "../../suites/data/suite-api";

export function resolvedRunSuiteCount(summary: SuiteSummary | undefined, detail: Suite | null) {
  if (!summary) return null;
  return detail?.id === summary.id ? detail.resolvedCaseCount : null;
}

export function useResolvedSuiteCount(http: TmsHttpClient, suite: SuiteSummary | undefined, offline: boolean, errorMessage: string) {
  const [detail, setDetail] = useState<Suite | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    setDetail(null); setError("");
    if (!suite) return;
    if (offline) {
      if (suite.type === "dynamic") {
        setError(errorMessage);
        return;
      }
      setDetail({ ...suite, caseIds: [], filter: {}, resolvedCaseCount: suite.caseCount });
      return;
    }
    const controller = new AbortController();
    getSuite(http, suite.id, controller.signal).then((resource) => setDetail(resource.data)).catch((caught: unknown) => {
      if (!(caught instanceof DOMException && caught.name === "AbortError")) setError(errorMessage);
    });
    return () => controller.abort();
  }, [errorMessage, http, offline, suite?.id, suite?.type]);
  return { count: resolvedRunSuiteCount(suite, detail), error };
}
