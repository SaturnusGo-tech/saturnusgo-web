import { useCallback, useEffect, useState } from "react";
import type { Suite } from "../../../../core/tms/contracts/legacy-contract";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { getSuite } from "../../suites/data/suite-api";

export function useSelectedSuiteResource(
  http: TmsHttpClient,
  connected: boolean,
  suiteId: string,
) {
  const [detail, setDetail] = useState<Suite | null>(null);
  const [etag, setEtag] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);
  useEffect(() => {
    setFailed(false);
    setDetail(null);
    setEtag(null);
    if (!connected || !suiteId) return;
    const controller = new AbortController();
    getSuite(http, suiteId, controller.signal).then((resource) => {
      if (controller.signal.aborted) return;
      setDetail(resource.data);
      setEtag(resource.etag);
    }).catch(() => {
      if (!controller.signal.aborted) setFailed(true);
    });
    return () => controller.abort();
  }, [connected, http, suiteId, requestVersion]);
  const retry = useCallback(() => {
    setFailed(false);
    setRequestVersion((current) => current + 1);
  }, []);
  return { detail, setDetail, etag, setEtag, failed, retry };
}
