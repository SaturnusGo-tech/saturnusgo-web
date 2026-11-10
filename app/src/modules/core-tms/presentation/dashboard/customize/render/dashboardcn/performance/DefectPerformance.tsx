"use client";

import { ErrorToast } from "../../../../../common/error/ErrorToast";
import { Button } from "@heroui/react";
import { useEffect, useState, type ReactNode } from "react";
import { useTmsHttpClient } from "../../../../../../auth/http/TmsHttpClientContext";
import type { DashboardAnalyticsSource, DashboardDrill, DashboardSnapshot } from "../../../../../../dashboards/model/dashboard-analytics";
import type { DashboardDefectBreakdown } from "../../../../../../dashboards/model/breakdown/dashboard-defect-breakdown";
import { readDashboardDefectLeadTime, type DefectLeadTimePage } from "../../../../../../dashboards/source/performance/readDashboardDefectLeadTime";
import { useTmsLocale } from "../../../../../../localization/context/useTmsLocale";
import type { DashboardViewProps } from "../../../../dashboard-view";
import { LeadTimePlot, ReportedPlot } from "./PerformancePlots";
import styles from "./performance.module.css";

type Props = {
  snapshot: DashboardSnapshot;
  readBreakdown?: DashboardAnalyticsSource["defectBreakdown"];
  openDrill?: (drill: DashboardDrill) => void;
  onOpenRow?: DashboardViewProps["onOpenRow"];
};

export function DefectPerformance({ snapshot, readBreakdown, openDrill, onOpenRow }: Props) {
  const { locale, languageTag, t } = useTmsLocale();
  const http = useTmsHttpClient();
  const ru = locale === "ru";
  const copy = {
    open: ru ? "Открытые дефекты" : "Total open bugs",
    lead: ru ? "Срок решения по приоритету" : "Lead time by priority",
    reported: ru ? "Дефекты, созданные за период" : "Bug reports in period",
    loading: ru ? "Загружаем данные…" : "Loading data…",
    empty: ru ? "Нет данных за выбранный период" : "No records in this period",
    preview: ru ? "Данные появятся на дашборде" : "Live data appears on the dashboard",
    failure: ru ? "Не удалось загрузить данные" : "Couldn't load data",
    more: ru ? "Показать ещё" : "Load more",
  };
  const scope = JSON.stringify([snapshot.query, snapshot.generatedAt]);
  const [reported, setReported] = useState<{ scope: string; data?: DashboardDefectBreakdown | null; failed?: boolean }>();
  const [lead, setLead] = useState<{ scope: string; page?: DefectLeadTimePage; failed?: boolean }>();
  const [next, setNext] = useState<{ scope: string; cursor: string }>();
  const [retry, setRetry] = useState(0);
  const activeReported = reported?.scope === scope ? reported : undefined;
  const activeLead = lead?.scope === scope ? lead : undefined;
  const cursor = next?.scope === scope ? next.cursor : undefined;
  useEffect(() => {
    if (!readBreakdown) return;
    const controller = new AbortController();
    void readBreakdown({ query: snapshot.query, basis: "reported", groupBy: "status", segmentBy: "none" },
      controller.signal).then(data => {
      if (!controller.signal.aborted) setReported({ scope, data });
    }).catch(() => { if (!controller.signal.aborted) setReported({ scope, failed: true }); });
    return () => controller.abort();
  }, [scope, readBreakdown, retry]);

  useEffect(() => {
    if (!readBreakdown) return;
    const controller = new AbortController();
    void readDashboardDefectLeadTime(http, snapshot.query, cursor, controller.signal).then(page => {
      if (!controller.signal.aborted) setLead(previous => ({
        scope, page: cursor && previous?.scope === scope && previous.page
          ? { ...page, data: [...new Map([...previous.page.data, ...page.data].map(row => [row.id, row])).values()] }
          : page,
      }));
    }).catch(() => {
      if (!controller.signal.aborted) setLead(previous => ({
        scope, failed: true, page: cursor && previous?.scope === scope ? previous.page : undefined,
      }));
    });
    return () => controller.abort();
  }, [http, scope, cursor, readBreakdown, retry]);

  const currentCount = new Intl.NumberFormat(languageTag).format(snapshot.metrics.openDefects);
  const openActive = () => openDrill?.({ id: "defects:open-inventory", label: copy.open,
    filter: { entity: "defect", basis: "current", activeOnly: true } });
  const reportData = activeReported?.data;
  const leadData = activeLead?.page;
  return <div className={styles.performance} data-defect-performance>
    <ErrorToast message={activeLead?.failed || activeReported?.failed ? copy.failure : null}
      retryLabel={t("dashboard.retry")} onRetry={() => {
        setLead(previous => previous ? { ...previous, failed: false } : previous);
        setReported(previous => previous ? { ...previous, failed: false } : previous);
        setRetry(value => value + 1);
      }} />
    <Panel title={copy.open} className={styles.open}>
      {openDrill && snapshot.metrics.openDefects > 0
        ? <Button type="button" disableRipple variant="light" className={styles.count} onPress={openActive}>{currentCount}</Button>
        : <strong className={styles.count}>{currentCount}</strong>}
    </Panel>
    <Panel title={copy.lead} className={styles.lead}>
      {!readBreakdown ? <p className={styles.notice}>{copy.preview}</p>
        : activeLead?.failed && !leadData ? null
          : !leadData ? <p className={styles.notice} role="status">{copy.loading}</p>
            : !leadData.data.length ? <p className={styles.notice}>{copy.empty}</p>
              : <LeadTimePlot points={leadData.data} onOpenRow={onOpenRow} />}
      {leadData?.meta.nextCursor && leadData.meta.hasMore && !activeLead?.failed &&
        <Button type="button" size="sm" variant="light" className={styles.more}
          isDisabled={cursor === leadData.meta.nextCursor}
          onPress={() => setNext({ scope, cursor: leadData.meta.nextCursor! })}>{copy.more}</Button>}
    </Panel>
    <Panel title={copy.reported} className={styles.reported}>
      {!readBreakdown || reportData === null ? <p className={styles.notice}>{copy.preview}</p>
        : activeReported?.failed ? null
          : !reportData ? <p className={styles.notice} role="status">{copy.loading}</p>
            : !reportData.total ? <p className={styles.notice}>{copy.empty}</p>
              : <ReportedPlot data={reportData} onPick={openDrill && ((status, label) => openDrill({
                id: `defects:reported:status:${status}`, label, window: reportData.period,
                filter: { entity: "defect", basis: "reported", status },
              }))} />}
    </Panel>
  </div>;
}

function Panel({ title, children, className }: { title: string; children: ReactNode; className: string }) {
  return <section className={`${styles.panel} ${className}`} aria-label={title}>
    <h2>{title}</h2>{children}
  </section>;
}
