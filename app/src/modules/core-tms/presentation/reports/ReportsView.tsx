"use client";

import { AlertTriangle, Bug, CheckCircle2, CircleDashed, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { Defect, ExternalLink, TestRunSummary } from "../../../../core/tms/contracts/legacy-contract";
import { localizedComponentLabel, localizedLabel } from "../../localization/format/labels";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { TessiqLoader } from "../common/loading/TessiqLoader";
import { DefectReportDetail, type DetailTab } from "./detail/DefectReportDetail";
import surface from "./reports.module.css";

export function ReportsView({ defects, runs, links, selectedDefectId, onSelectDefect,
  selectedDefectStatus, onRetrySelectedDefect, onNew, onOpenRun }: {
  defects: Defect[];
  runs: TestRunSummary[];
  links: ExternalLink[];
  selectedDefectId: string | null;
  onSelectDefect: (defectId: string | null) => void;
  selectedDefectStatus: "idle" | "loading" | "ready" | "error";
  onRetrySelectedDefect: () => void;
  onNew: () => void;
  onOpenRun: (runId: string, runItemId: string | null) => void;
}) {
  const { locale, t } = useTmsLocale();
  const [query, setQuery] = useState("");
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const selectedDefect = defects.find((item) => item.id === selectedDefectId);
  const normalizedQuery = query.trim().toLocaleLowerCase(locale);
  const visibleDefects = useMemo(() => {
    if (!normalizedQuery) return defects;
    return defects.filter((defect) => [
      defect.key, defect.title, defect.description, defect.component,
      defect.assigneeIdentityId ?? "", ...defect.labels,
    ].some((value) => value.toLocaleLowerCase(locale).includes(normalizedQuery)));
  }, [defects, locale, normalizedQuery]);
  const open = defects.filter((item) => !["closed", "verified"].includes(item.status)).length;
  const critical = defects.filter((item) => item.severity === "critical").length;
  const completed = runs.filter((item) => item.status === "completed").length;

  function selectDefect(defectId: string | null) {
    if (defectId !== selectedDefectId) setDetailTab("overview");
    onSelectDefect(defectId);
  }

  return <div className={surface.workspace} data-testid="reports-view" data-detail-open={Boolean(selectedDefectId) || undefined}>
    <section className={surface.listPane} aria-label={t("reports.title")}>
      <header className={surface.toolbar}>
        <label className={surface.searchField}>
          <Search size={17} aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)}
            placeholder={t("reports.searchPlaceholder")} aria-label={t("reports.searchPlaceholder")} />
        </label>
        <div className={surface.metrics} aria-label={t("reports.title")}>
          <span><b>{open}</b>{t("reports.openShort")}</span>
          <span><b>{critical}</b>{t("reports.criticalShort")}</span>
          <span><b>{completed}</b>{t("reports.runsShort")}</span>
        </div>
        <button className={surface.newButton} onClick={onNew}><Bug size={16} />{t("reports.newBug")}</button>
      </header>
      <div className={surface.listSummary}>
        <strong>{t("reports.title")}</strong>
        <span>{formatDefectCount(visibleDefects.length, locale)}</span>
      </div>
      <div className={surface.tableViewport}>
        <table className={surface.table}>
          <thead><tr>
            <th aria-label={t("reports.severity")} />
            <th scope="col">{t("reports.key")}</th>
            <th scope="col">{t("reports.summary")}</th>
            <th scope="col">{t("reports.component")}</th>
            <th scope="col">{t("reports.status")}</th>
            <th scope="col">{t("reports.assignee")}</th>
          </tr></thead>
          <tbody>{visibleDefects.length === 0 ? <tr><td colSpan={6}>
            <div className={surface.empty}><Bug size={20} /><span><strong>{t("reports.empty")}</strong><small>{normalizedQuery ? t("reports.emptySearch") : t("reports.emptyHint")}</small></span></div>
          </td></tr> : visibleDefects.map((defect) => <tr key={defect.id} data-selected={defect.id === selectedDefectId || undefined}>
            <td><span className={surface.severityMark} data-level={defect.severity} title={localizedLabel(locale, defect.severity)}>
              <AlertTriangle size={14} fill="currentColor" />
            </span></td>
            <td><button className={surface.rowButton} type="button" onClick={() => selectDefect(defect.id)}>
              <span className={surface.key}>{defect.key}</span>
            </button></td>
            <td><button className={surface.rowButton} type="button" onClick={() => selectDefect(defect.id)}>
              <strong className={surface.title}>{defect.title}</strong>
              {defect.labels.length > 0 && <small className={surface.labels}>{defect.labels.slice(0, 3).join(", ")}</small>}
            </button></td>
            <td>{localizedComponentLabel(locale, defect.component) || "—"}</td>
            <td><span className={surface.statusChip} data-status={defect.status}>
              {defect.status === "open" ? <CircleDashed size={13} aria-hidden="true" />
                : defect.status === "verified" || defect.status === "closed" ? <CheckCircle2 size={13} aria-hidden="true" />
                  : <span aria-hidden="true" />}
              {localizedLabel(locale, defect.status)}
            </span></td>
            <td>{defect.assigneeIdentityId || t("common.unassigned")}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>

    {selectedDefectId && <aside className={surface.detailPanel} aria-label={locale === "ru" ? "Баг-репорт" : "Bug report"}>
      {selectedDefect
        ? <DefectReportDetail
            defect={selectedDefect}
            run={runs.find((item) => item.id === selectedDefect.runId)}
            links={links.filter((link) => link.owner.kind === "defect" && link.owner.defectId === selectedDefect.id)}
            tab={detailTab}
            onTabChange={setDetailTab}
            onBack={() => selectDefect(null)}
            onOpenRun={onOpenRun}
          />
        : selectedDefectStatus === "error"
          ? <div className={surface.detailError} role="alert"><Bug size={22} /><strong>{locale === "ru" ? "Не удалось открыть баг-репорт" : "Could not open the bug report"}</strong><span>{locale === "ru" ? "Проверьте подключение и повторите." : "Check the connection and try again."}</span><button type="button" onClick={onRetrySelectedDefect}>{locale === "ru" ? "Повторить" : "Retry"}</button></div>
          : <TessiqLoader pane label={locale === "ru" ? "Загрузка баг-репорта" : "Loading bug report"} testId="defect-detail-loading" />}
    </aside>}
  </div>;
}

function formatDefectCount(count: number, locale: "ru" | "en") {
  if (locale === "en") return `${count} ${count === 1 ? "bug report" : "bug reports"}`;
  const category = new Intl.PluralRules("ru").select(count);
  const noun = category === "one" ? "баг-репорт" : category === "few" ? "баг-репорта" : "баг-репортов";
  return `${count} ${noun}`;
}
