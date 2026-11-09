import { reconcileMaintenance } from "../../test-cases/maintenance/model/case-maintenance";
import { useCallback, useEffect, useRef, useState } from "react";
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

  const resource = useRef({ detail, etag });
  resource.current = { detail, etag };
  const requestScope = useRef({ http, connection, requestVersion });
  const selected = testCases.find(item => item.id === caseId);
  const selectedRef = useRef(selected); selectedRef.current = selected;
  const contentKey = connection === "demo" ? selected : selected ? JSON.stringify([selected.projectId, selected.etag]) : "";
  useEffect(() => {
    setDetail(current => current ? reconcileMaintenance(current, selected) : current);
  }, [caseId, selected?.maintenance]);
  useEffect(() => {
    const previous = requestScope.current;
    requestScope.current = { http, connection, requestVersion };
    setFailed(false);
    if (connection === "demo") {
      setDetail(selected && "current" in selected && "linkIds" in selected
        ? selected as unknown as TestCase
        : null);
      setEtag(null);
      return;
    }
    const cached = resource.current;
    const current = selectedRef.current;
    // The mutation receipt already supplied the exact version that the repository lists.
    if (connection === "connected" && previous.connection === connection && previous.http === http
      && previous.requestVersion === requestVersion && cached.detail?.id === caseId
      && cached.detail?.projectId === current?.projectId && cached.etag && cached.etag === current?.etag) return;

    setDetail(null);
    setEtag(null);
    if (connection !== "connected" || !caseId) return;
    const controller = new AbortController();
    getTestCase(http, caseId, controller.signal).then((resource) => {
      if (controller.signal.aborted) return;
      setDetail(current => reconcileMaintenance(reconcileMaintenance(resource.data, current), selectedRef.current));
      setEtag(resource.etag);
    }).catch(() => {
      if (!controller.signal.aborted) setFailed(true);
    });
    return () => controller.abort();
  }, [caseId, connection, http, requestVersion, contentKey]);

  const retry = useCallback(() => {
    setFailed(false);
    setRequestVersion((current) => current + 1);
  }, []);

  return { detail, setDetail, etag, setEtag, failed, retry };
}
