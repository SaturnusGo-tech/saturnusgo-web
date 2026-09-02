"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Bootstrap } from "../../../../../core/tms/contracts/legacy-contract";
import type {
  DashboardAnalyticsQuery, DashboardAnalyticsSource, DashboardDrill,
  DashboardDrillPage, DashboardSnapshot,
} from "../../../dashboards/model/dashboard-analytics";
import { createBootstrapDashboardAnalyticsSource } from "../../../dashboards/source/bootstrap-dashboard-analytics-source";

type DrillState = {
  origin: DashboardDrill | null;
  selected: DashboardDrill | null;
  page: DashboardDrillPage | null;
  loading: boolean;
  error: boolean;
};

const EMPTY_DRILL: DrillState = { origin: null, selected: null, page: null, loading: false, error: false };

export function useDashboardAnalytics(
  data: Bootstrap,
  query: DashboardAnalyticsQuery,
  suppliedSource?: DashboardAnalyticsSource,
) {
  const source = useMemo(
    () => suppliedSource ?? createBootstrapDashboardAnalyticsSource(data),
    [data, suppliedSource],
  );
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [drill, setDrill] = useState<DrillState>(EMPTY_DRILL);
  const drillController = useRef<AbortController | null>(null);
  const queryKey = `${query.workspaceId}:${query.projectId ?? "workspace"}:${query.period}`;
  const previousQuery = useRef(queryKey);

  useEffect(() => () => drillController.current?.abort(), []);

  useEffect(() => {
    const controller = new AbortController();
    if (previousQuery.current !== queryKey) {
      previousQuery.current = queryKey;
      drillController.current?.abort();
      setSnapshot(null);
      setDrill(EMPTY_DRILL);
    }
    setSummaryLoading(true);
    setSummaryError(false);
    void source.summary(query, controller.signal).then((next) => {
      setSnapshot(next);
      setSummaryLoading(false);
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      setSummaryLoading(false);
      setSummaryError(true);
      console.error("Dashboard analytics summary failed", error);
    });
    return () => controller.abort();
  }, [queryKey, refreshVersion, source]);

  const loadDrill = useCallback((selected: DashboardDrill, cursor?: string) => {
    drillController.current?.abort();
    const controller = new AbortController();
    drillController.current = controller;
    setDrill((current) => ({
      origin: current.origin ?? selected,
      selected, page: cursor ? current.page : null, loading: true, error: false,
    }));
    void source.drill({ query, drill: selected, cursor, limit: 25 }, controller.signal)
      .then((page) => setDrill((current) => {
        if (current.selected?.id !== selected.id) return current;
        return {
          origin: current.origin ?? selected, selected, loading: false, error: false,
          page: cursor && current.page
            ? { ...page, rows: [...current.page.rows, ...page.rows] }
            : page,
        };
      }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setDrill((current) => current.selected?.id === selected.id
          ? { ...current, loading: false, error: true }
          : current);
        console.error("Dashboard analytics drill failed", error);
      });
  }, [queryKey, source]);

  const openDrill = useCallback((selected: DashboardDrill) => {
    setDrill({ origin: selected, selected: null, page: null, loading: false, error: false });
    loadDrill(selected);
  }, [loadDrill]);
  const selectRelatedDrill = useCallback((selected: DashboardDrill) => {
    loadDrill(selected);
  }, [loadDrill]);
  const retryDrill = useCallback(() => {
    if (drill.selected) loadDrill(drill.selected);
  }, [drill.selected, loadDrill]);
  const loadMore = useCallback(() => {
    if (drill.selected && drill.page?.nextCursor && !drill.loading) {
      loadDrill(drill.selected, drill.page.nextCursor);
    }
  }, [drill, loadDrill]);

  return {
    snapshot,
    summaryLoading,
    summaryError,
    refresh: () => setRefreshVersion((value) => value + 1),
    drill,
    openDrill,
    selectRelatedDrill,
    closeDrill: () => {
      drillController.current?.abort();
      setDrill(EMPTY_DRILL);
    },
    retryDrill,
    loadMore,
  };
}
