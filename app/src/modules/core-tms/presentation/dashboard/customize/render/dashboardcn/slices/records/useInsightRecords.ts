import { useEffect, useState } from "react";
import type { DashboardAnalyticsQuery, DashboardAnalyticsSource, DashboardDrill, DashboardDrillRow } from
  "../../../../../../../dashboards/model/dashboard-analytics";

type Reader = DashboardAnalyticsSource["drill"];
type Result = { key: string; read: Reader; rows: DashboardDrillRow[] | null };

export function canOpenInsightRecord(row: DashboardDrillRow) {
  return row.entity === "defect" || !row.archivedAt;
}

export function useInsightRecords(query: DashboardAnalyticsQuery, drill?: DashboardDrill, read?: Reader, revision?: string) {
  const [result, setResult] = useState<Result>();
  const [retry, setRetry] = useState(0);
  const key = JSON.stringify([query, drill?.filter, drill?.projectId, drill?.window, revision, retry]);
  useEffect(() => {
    if (!read || !drill) return;
    const controller = new AbortController();
    void read({ query, drill, limit: 3 }, controller.signal).then(page => {
      if (!controller.signal.aborted) setResult({ key, read, rows: page.rows });
    }).catch(() => { if (!controller.signal.aborted) setResult({ key, read, rows: null }); });
    return () => controller.abort();
  }, [key, read]);
  return { rows: result?.key === key && result.read === read ? result.rows : undefined,
    retry: () => setRetry(value => value + 1) };
}
