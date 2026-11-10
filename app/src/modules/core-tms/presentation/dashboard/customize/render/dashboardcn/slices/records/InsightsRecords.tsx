import { ErrorToast } from "../../../../../../common/error/ErrorToast";
import { LoadingOrb } from "../../../../../../../../../shared/components/loading/LoadingOrb";
import { Listbox, ListboxItem } from "@heroui/react";
import { useIsPresent } from "framer-motion";
import { ArrowUpRight, X } from "lucide-react";
import type { DashboardAnalyticsQuery, DashboardAnalyticsSource, DashboardDrill } from
  "../../../../../../../dashboards/model/dashboard-analytics";
import { useTmsLocale } from "../../../../../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../../../../../localization/format/labels";
import { useLoadingFeedback } from "../../../../../../common/loading/feedback/useLoadingFeedback";
import { PriorityIcon, priorityLabel, priorityLevels } from "../../../../../../common/properties/PriorityIcon";
import { DefectDrillList } from "../../../../../inspector/table/defects/DefectDrillList";
import type { DashboardViewProps } from "../../../../../dashboard-view";
import { WidgetAction } from "../../card/WidgetCard";
import { insightCopy } from "../controls/insight-copy";
import type { InsightMeasure } from "../model/insight-view";
import { canOpenInsightRecord, useInsightRecords } from "./useInsightRecords";
import styles from "./insights-records.module.css";

export function InsightsRecords({ item, query, revision, readDrill, openDrill, onOpenRow, onClose }: {
  item: InsightMeasure; query: DashboardAnalyticsQuery; revision: string; readDrill?: DashboardAnalyticsSource["drill"];
  openDrill?: (drill: DashboardDrill) => void; onOpenRow?: DashboardViewProps["onOpenRow"]; onClose: () => void;
}) {
  const { t, locale } = useTmsLocale();
  const present = useIsPresent();
  const drill = item.drill && { ...item.drill, label: item.drill.label || item.label };
  const { rows, retry } = useInsightRecords(query, drill, readDrill, revision);
  const loading = rows === undefined;
  const showLoading = useLoadingFeedback(Boolean(readDrill && drill && loading));
  const label = drill?.label ?? item.label;
  const items = (rows ?? []).map(row => ({ key: `${row.projectId}:${row.id}`, row }));
  const disabledKeys = items.filter(({ row }) => !onOpenRow || !canOpenInsightRecord(row)).map(({ key }) => key);

  return <section className={styles.records} aria-label={label} inert={!present} aria-hidden={!present || undefined}>
    <header className={styles.heading}>
      <h3>{label}</h3>
      <div>
        {drill && openDrill && <WidgetAction onClick={() => openDrill(drill)}>{t("dashboard.openAll")}<ArrowUpRight size={12} aria-hidden="true" /></WidgetAction>}
        <WidgetAction aria-label={insightCopy[locale].close} onClick={onClose}><X size={13} aria-hidden="true" /></WidgetAction>
      </div>
    </header>
    {readDrill && <div aria-live="polite" aria-busy={loading || showLoading}>
      {showLoading ? <p className={styles.loading}><LoadingOrb size="sm" /> {t("dashboard.drillLoading")}</p> : loading ? null : rows === null ? <ErrorToast message={t("dashboard.drillError")} retryLabel={t("dashboard.retry")} onRetry={retry} />
        : items.length === 0 ? <p>{t("dashboard.drillEmpty")}</p>
          : drill?.filter.entity === "defect" ? <DefectDrillList rows={rows} onOpenRow={onOpenRow} compact />
          : <Listbox aria-label={label} selectionMode="none" disabledKeys={disabledKeys}
            classNames={{ base: styles.list, list: styles.listItems }} itemClasses={{ base: styles.option, title: styles.title }}
            onAction={key => {
              const row = items.find(item => item.key === key)?.row;
              if (row && canOpenInsightRecord(row)) onOpenRow?.(row);
            }}>
            {items.map(({ key, row }) => {
              const priority = priorityLevels.find(level => level.key === row.priority)?.key;
              const priorityName = priorityLabel(locale, priority);
              const status = row.status;
              const statusName = status && localizedLabel(locale, status);
              const textValue = [row.key, row.title, priorityName, statusName].filter(Boolean).join(" · ");
              return <ListboxItem key={key} textValue={textValue} aria-label={textValue}>
                <span className={styles.row}>
                  <span className={styles.priority} title={priorityName}><PriorityIcon level={priority} empty="circle" size={14} /></span>
                  <strong title={row.title}>{row.title}</strong>
                  {statusName && <span className={styles.status} title={statusName} aria-hidden="true">{statusName}</span>}
                  <span className={styles.key}>{row.key}</span>
                </span>
              </ListboxItem>;
            })}
          </Listbox>}
    </div>}
  </section>;
}
