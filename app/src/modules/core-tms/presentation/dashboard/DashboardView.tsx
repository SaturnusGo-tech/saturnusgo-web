import {
  BadgeCheck,
  Bug,
  CalendarDays,
  FileCheck2,
  PlayCircle,
  Plus,
  RefreshCw,
  XCircle,
} from "lucide-react";
import type { Bootstrap } from "../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import styles from "../../tms.module.css";
import { DashboardTrendChart } from "./charts/DashboardTrendChart";
import { createDashboardSnapshot } from "./model/createDashboardSnapshot";
import { DashboardOperations } from "./sections/DashboardOperations";

type DashboardViewProps = {
  data: Bootstrap;
  projectId: string;
  onCreate: () => void;
  onOpenRuns: () => void;
};

export function DashboardView({ data, projectId, onCreate, onOpenRuns }: DashboardViewProps) {
  const { languageTag, t } = useTmsLocale();
  const snapshot = createDashboardSnapshot(data, projectId);
  const updatedAt = new Intl.DateTimeFormat(languageTag, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(data.meta.generatedAt));
  const metrics = [
    {
      label: t("dashboard.testCases"), value: snapshot.cases,
      hint: t("dashboard.createdInWindow", { count: snapshot.casesCreated }),
      icon: <FileCheck2 size={18} />, tone: "dashboardMetricNeutral",
    },
    {
      label: t("dashboard.runsStarted"), value: snapshot.runsStarted,
      hint: t("dashboard.startedInWindow", { count: snapshot.runsStartedRecent }),
      icon: <PlayCircle size={18} />, tone: "dashboardMetricNeutral",
    },
    {
      label: t("dashboard.failures"), value: snapshot.failures,
      hint: t("dashboard.failedInWindow", { count: snapshot.failuresRecent }),
      icon: <XCircle size={18} />, tone: "dashboardMetricDanger",
    },
    {
      label: t("dashboard.openDefects"), value: snapshot.openDefects,
      hint: t("dashboard.defectsInWindow", { count: snapshot.defectsCreated }),
      icon: <Bug size={18} />, tone: "dashboardMetricDanger",
    },
    {
      label: t("dashboard.passRate"), value: `${snapshot.passRate}%`,
      hint: t("dashboard.executedCount", { count: snapshot.executed }),
      icon: <BadgeCheck size={18} />, tone: "dashboardMetricSuccess",
    },
  ] as const;

  return (
    <div className={`${styles.pageScroll} ${styles.dashboardPage}`}>
      <header className={styles.dashboardHeader}>
        <div className={styles.dashboardTitleRow}>
          <div>
            <span className={styles.eyebrow}>{t("dashboard.eyebrow")}</span>
            <h1>{t("dashboard.ledgerTitle")}</h1>
            <p>{t("dashboard.ledgerDescription")}</p>
          </div>
          <button className={styles.secondaryButton} onClick={onCreate}>
            <Plus size={16} /> {t("dashboard.create")}
          </button>
        </div>
        <div className={styles.dashboardRangeRow}>
          <span><CalendarDays size={16} /> {t("dashboard.last30Days")}</span>
          <small>{t("dashboard.updatedAt", { date: updatedAt })}</small>
          <RefreshCw size={15} aria-hidden="true" />
        </div>
      </header>

      <section className={styles.dashboardLedger} aria-label={t("dashboard.summaryAria")}>
        {metrics.map((metric) => (
          <article className={`${styles.dashboardMetric} ${styles[metric.tone]}`} key={metric.label}>
            <div><span>{metric.icon}</span><small>{metric.label}</small></div>
            <strong>{metric.value}</strong>
            <p>{metric.hint}</p>
          </article>
        ))}
      </section>

      <DashboardTrendChart snapshot={snapshot} />
      <DashboardOperations snapshot={snapshot} onOpenRuns={onOpenRuns} />
    </div>
  );
}
