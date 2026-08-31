import { useCallback, useEffect, useState } from "react";
import type {
  TestCase,
  TestCaseSummary,
} from "../../../../core/tms/contracts/legacy-contract";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { getTestCase } from "../../test-cases/data/test-case-api";
import type { WorkspaceConnection } from "../workspace/useWorkspaceBootstrap";

export function useSelectedCaseResource(
  http: TmsHttpClient,
  connection: WorkspaceConnection,
  testCases: TestCaseSummary[],
  caseId: string,
) {
  const [detail, setDetail] = useState<TestCase | null>(null);
  const [etag, setEtag] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    setFailed(false);
    if (connection === "demo") {
      const selected = testCases.find((item) => item.id === caseId);
      setDetail(selected && "current" in selected ? selected as TestCase : null);
      setEtag(null);
      return;
    }
    setDetail(null);
    setEtag(null);
    if (connection !== "connected" || !caseId) return;
    const controller = new AbortController();
    getTestCase(http, caseId, controller.signal).then((resource) => {
      if (controller.signal.aborted) return;
      setDetail(resource.data);
      setEtag(resource.etag);
    }).catch(() => {
      if (!controller.signal.aborted) setFailed(true);
    });
    return () => controller.abort();
  }, [caseId, connection, http, requestVersion, testCases]);

  const retry = useCallback(() => {
    setFailed(false);
    setRequestVersion((current) => current + 1);
  }, []);

  return { detail, setDetail, etag, setEtag, failed, retry };
}
