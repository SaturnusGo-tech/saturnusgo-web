import { Bot, Bug, ChevronDown, ChevronRight, CircleDashed, ClipboardCheck, ExternalLink, Hand, ListChecks, PlayCircle } from "lucide-react";
import type { DashboardDrillRow } from "../../../../dashboards/model/dashboard-analytics";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../../localization/format/labels";
import { isPrioritySignalLevel, PrioritySignal } from "../../../cases/list/PrioritySignal";
import surface from "../../dashboard.module.css";

const icon = (row: DashboardDrillRow) => {
  if (row.entity === "defect") return <Bug size={15} />;
  if (row.entity === "run" || row.entity === "run_item") return <PlayCircle size={15} />;
  if (row.type === "automated") return <Bot size={15} />;
  if (row.type === "checklist") return <ListChecks size={15} />;
  return <Hand size={15} />;
};

const safeUrl = (value: string) => {
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.href : null; }
  catch { return null; }
};

export function DashboardDrillTable({ rows, prioritySort, onPrioritySort, onOpenRow }: {
  rows: DashboardDrillRow[];
  prioritySort: "asc" | "desc" | null;
  onPrioritySort: () => void;
  onOpenRow: (row: DashboardDrillRow) => void;
}) {
  const { locale, languageTag, t } = useTmsLocale();
  const recordLabel = rows[0]?.entity === "defect" ? t("dashboard.defects")
    : rows[0]?.entity === "run" || rows[0]?.entity === "run_item" ? t("dashboard.runs") : t("dashboard.testCases");
  const date = (value?: string) => value ? new Intl.DateTimeFormat(languageTag, {
    day: "2-digit", month: "short", year: "numeric",
  }).format(new Date(value)) : "—";
  const prioritySortable = rows.some((row) => isPrioritySignalLevel(row.priority));
  return <div className={surface.drillTableViewport}><table className={surface.drillTable} data-entity={rows[0]?.entity ?? "empty"}>
    <thead><tr><th scope="col" aria-sort={prioritySort === "asc" ? "ascending" : prioritySort === "desc" ? "descending" : "none"}>
      {prioritySortable ? <button type="button" className={surface.prioritySortButton} onClick={onPrioritySort}
        aria-label={locale === "ru" ? "Сортировать по приоритету" : "Sort by priority"}
        title={locale === "ru" ? "Сортировать по приоритету" : "Sort by priority"}
        data-active={Boolean(prioritySort) || undefined} data-direction={prioritySort ?? undefined}><ChevronDown size={14} /></button>
        : <span className={surface.visuallyHidden}>{t("dashboard.type")}</span>}</th><th scope="col">ID</th>
      <th scope="col">{t("dashboard.status")}</th><th scope="col">{recordLabel}</th>
      <th scope="col">{t("dashboard.component")}</th><th scope="col">{t("dashboard.updated")}</th>
      <th scope="col"><span className={surface.visuallyHidden}>{t("dashboard.openRecord")}</span></th></tr></thead>
    <tbody>{rows.map((row) => {
      const external = row.links.find((link) => safeUrl(link.url));
      return <tr key={row.id} data-entity={row.entity}><td><span className={surface.recordSignals}>
          {row.entity !== "run" && row.entity !== "run_item" && isPrioritySignalLevel(row.priority) && <PrioritySignal priority={row.priority} label={localizedLabel(locale, row.priority)} size={14} />}
          <span className={surface.entityIcon} data-type={row.type ?? row.entity}>{icon(row)}</span>
        </span></td>
        <td className={surface.drillKey}>{row.key}</td>
        <td>{row.status ? <span className={surface.drillStatus} data-status={row.status}>
          {["open", "draft", "not_run", "active"].includes(row.status) ? <CircleDashed size={12} /> : <i />}{localizedLabel(locale, row.status)}
        </span> : "—"}</td>
        <td><button type="button" className={surface.drillRecordButton} onClick={() => onOpenRow(row)}>
          <strong>{row.title}</strong><span>{[row.project, row.detail].filter(Boolean).join(" · ")}</span></button></td>
        <td>{row.component || "—"}</td>
        <td><time dateTime={row.occurredAt}>{date(row.occurredAt)}</time></td>
        <td><span className={surface.rowActions}><button type="button" onClick={() => onOpenRow(row)} aria-label={t("dashboard.openRecord")}><ChevronRight size={15} /></button>
          {external && <a href={external.url} target="_blank" rel="noreferrer noopener" aria-label={t("dashboard.openExternalLink", { label: external.label })}><ExternalLink size={14} /></a>}</span></td>
      </tr>;
    })}</tbody>
  </table>{rows.length === 0 && <div className={surface.tableEmpty}><ClipboardCheck size={22} />{t("dashboard.localFilterEmpty")}</div>}</div>;
}
