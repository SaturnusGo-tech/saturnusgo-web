import { Bot, Bug, ChevronRight, ClipboardCheck, ExternalLink, Hand, ListChecks, PlayCircle } from "lucide-react";
import type { DashboardDrillRow } from "../../../../dashboards/model/dashboard-analytics";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../../localization/format/labels";
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

export function DashboardDrillTable({ rows, onOpenRow }: {
  rows: DashboardDrillRow[];
  onOpenRow: (row: DashboardDrillRow) => void;
}) {
  const { locale, languageTag, t } = useTmsLocale();
  const date = (value?: string) => value ? new Intl.DateTimeFormat(languageTag, {
    day: "2-digit", month: "short", year: "numeric",
  }).format(new Date(value)) : "—";
  return <div className={surface.drillTableViewport}><table className={surface.drillTable}>
    <thead><tr><th scope="col">{t("dashboard.type")}</th><th scope="col">{t("dashboard.record")}</th>
      <th scope="col">{t("dashboard.project")}</th><th scope="col">{t("dashboard.component")}</th>
      <th scope="col">{t("dashboard.status")}</th><th scope="col">{t("dashboard.priority")}</th>
      <th scope="col">{t("dashboard.updated")}</th><th scope="col"><span className={surface.visuallyHidden}>{t("dashboard.openRecord")}</span></th></tr></thead>
    <tbody>{rows.map((row) => {
      const external = row.links.find((link) => safeUrl(link.url));
      return <tr key={row.id}><td><span className={surface.entityIcon} data-type={row.type ?? row.entity}>{icon(row)}</span></td>
        <td><button type="button" className={surface.drillRecordButton} onClick={() => onOpenRow(row)}>
          <small>{row.key}</small><strong>{row.title}</strong>{row.detail && <span>{row.detail}</span>}</button></td>
        <td>{row.project}</td><td>{row.component || "—"}</td>
        <td>{row.status ? <span className={surface.drillStatus} data-status={row.status}>{localizedLabel(locale, row.status)}</span> : "—"}</td>
        <td>{row.priority ? <span className={surface.drillPriority} data-priority={row.priority}>{localizedLabel(locale, row.priority)}</span> : "—"}</td>
        <td><time dateTime={row.occurredAt}>{date(row.occurredAt)}</time></td>
        <td><span className={surface.rowActions}><button type="button" onClick={() => onOpenRow(row)} aria-label={t("dashboard.openRecord")}><ChevronRight size={15} /></button>
          {external && <a href={external.url} target="_blank" rel="noreferrer noopener" aria-label={t("dashboard.openExternalLink", { label: external.label })}><ExternalLink size={14} /></a>}</span></td>
      </tr>;
    })}</tbody>
  </table>{rows.length === 0 && <div className={surface.tableEmpty}><ClipboardCheck size={22} />{t("dashboard.localFilterEmpty")}</div>}</div>;
}
