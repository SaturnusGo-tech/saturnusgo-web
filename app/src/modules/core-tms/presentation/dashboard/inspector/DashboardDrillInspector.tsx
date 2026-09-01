"use client";

import { ExternalLink, LoaderCircle, RefreshCw, Rows3 } from "lucide-react";
import type { DashboardAnalyticsQuery, DashboardDrill, DashboardDrillPage } from "../../../dashboards/model/dashboard-analytics";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../localization/format/labels";
import { Modal } from "../../common/modal/Modal";
import surface from "../dashboard.module.css";

type Props = {
  query: DashboardAnalyticsQuery;
  selected: DashboardDrill;
  page: DashboardDrillPage | null;
  loading: boolean;
  error: boolean;
  onClose: () => void;
  onRetry: () => void;
  onLoadMore: () => void;
};

function safeExternalUrl(value: string) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function DashboardDrillInspector(props: Props) {
  const { locale, languageTag, t } = useTmsLocale();
  const projectId = props.selected.projectId ?? props.query.projectId ?? "*";
  const filterEntries = Object.entries({
    workspaceId: props.query.workspaceId,
    projectId,
    period: props.selected.window ? "custom" : props.query.period,
    ...(props.selected.window ?? {}),
    ...props.selected.filter,
  }).filter((entry): entry is [string, string | boolean] => entry[1] !== undefined);
  const dateTime = (value?: string) => value ? new Intl.DateTimeFormat(languageTag, {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(value)) : null;

  return (
    <Modal
      drawer
      title={props.selected.label}
      subtitle={t("dashboard.drillTitle")}
      onClose={props.onClose}
      panelClassName={surface.drillModal}
    >
      <div className={surface.drillBody}>
        <section className={surface.filterSection} aria-labelledby="dashboard-filter-title">
          <h3 id="dashboard-filter-title">{t("dashboard.exactFilters")}</h3>
          <dl className={surface.filterChips}>
            {filterEntries.map(([key, value]) => (
              <div key={key}><dt>{key}</dt><dd>{String(value)}</dd></div>
            ))}
          </dl>
        </section>

        {props.page?.total !== undefined && (
          <p className={surface.matchCount}><Rows3 size={15} /> {t("dashboard.matches", { count: props.page.total })}</p>
        )}
        {props.error ? (
          <div className={surface.drillState} role="alert">
            <strong>{t("dashboard.drillError")}</strong>
            <button type="button" onClick={props.onRetry}><RefreshCw size={14} />{t("dashboard.retry")}</button>
          </div>
        ) : props.loading && !props.page ? (
          <div className={surface.drillState} role="status">
            <LoaderCircle className={surface.spin} size={21} />
            <span>{t("dashboard.drillLoading")}</span>
          </div>
        ) : props.page && props.page.rows.length === 0 ? (
          <div className={surface.drillState}><Rows3 size={21} /><span>{t("dashboard.drillEmpty")}</span></div>
        ) : (
          <ol className={surface.drillList} aria-busy={props.loading}>
            {props.page?.rows.map((row) => (
              <li key={row.id}>
                <div className={surface.drillRecordHeading}>
                  <span>{row.key}</span>
                  {row.status && <small>{localizedLabel(locale, row.status)}</small>}
                </div>
                <strong>{row.title}</strong>
                <p>{row.project}{row.detail ? ` · ${row.detail}` : ""}</p>
                {row.occurredAt && <time dateTime={row.occurredAt}>{dateTime(row.occurredAt)}</time>}
                {row.links.length > 0 && (
                  <div className={surface.recordLinks} aria-label={t("dashboard.externalLinks")}>
                    {row.links.map((link) => {
                      const href = safeExternalUrl(link.url);
                      return href ? (
                        <a key={`${row.id}:${href}`} href={href} target="_blank" rel="noreferrer noopener" aria-label={t("dashboard.openExternalLink", { label: link.label })}>
                          <ExternalLink size={13} />{link.label}
                        </a>
                      ) : null;
                    })}
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
        {props.page?.nextCursor && !props.error && (
          <button type="button" className={surface.loadMore} onClick={props.onLoadMore} disabled={props.loading}>
            {props.loading && <LoaderCircle className={surface.spin} size={14} />}
            {t("dashboard.loadMore")}
          </button>
        )}
      </div>
    </Modal>
  );
}
