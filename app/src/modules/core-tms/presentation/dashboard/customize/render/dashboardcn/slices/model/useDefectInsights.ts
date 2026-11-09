import { useEffect, useState } from "react";
import type { DashboardAnalyticsSource } from "../../../../../../../dashboards/model/dashboard-analytics";
import type { DashboardDefectBreakdown, DashboardDefectBreakdownRequest } from
  "../../../../../../../dashboards/model/breakdown/dashboard-defect-breakdown";

type Reader = NonNullable<DashboardAnalyticsSource["defectBreakdown"]>;
type Outcome = { request: DashboardDefectBreakdownRequest; read: Reader; retry: number; data?: DashboardDefectBreakdown | null; failed?: true };
type Result = { request: DashboardDefectBreakdownRequest; read: Reader; data: DashboardDefectBreakdown };

export function useDefectInsights(request: DashboardDefectBreakdownRequest | null,
  read?: Reader) {
  const [outcome, setOutcome] = useState<Outcome>();
  const [latest, setLatest] = useState<Result>();
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!request || !read) return;
    const controller = new AbortController();
    void read(request, controller.signal).then(data => {
      if (controller.signal.aborted) return;
      setOutcome({ request, read, retry, data });
      if (data) setLatest({ request, read, data });
    }).catch(() => {
      if (!controller.signal.aborted) setOutcome({ request, read, retry, failed: true });
    });
    return () => controller.abort();
  }, [request, read, retry]);
  const selected = outcome?.request === request && outcome.read === read && outcome.retry === retry ? outcome : undefined;
  const previous = request && latest?.read === read && JSON.stringify(latest?.request.query) === JSON.stringify(request.query)
    ? latest : undefined;
  return { data: selected?.data, previous, loading: Boolean(request && !selected), error: selected?.failed,
    retry: () => setRetry(count => count + 1) };
}
