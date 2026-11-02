import { useEffect, useState } from "react";
import { useOptionalTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { getPortfolio } from "../../../portfolios/data/portfolio-api";

export function useProjectPortfolioName(id: string | null, offline: boolean) {
  const http = useOptionalTmsHttpClient();
  const [resolved, setResolved] = useState<{ id: string; name: string } | null>(null);
  useEffect(() => {
    if (!id || offline || !http) return;
    const controller = new AbortController();
    void getPortfolio(http, id, controller.signal).then(result => {
      if (!controller.signal.aborted) setResolved({ id, name: result.data.name });
    }).catch(() => {});
    return () => controller.abort();
  }, [http, id, offline]);
  return resolved?.id === id ? resolved.name : null;
}
