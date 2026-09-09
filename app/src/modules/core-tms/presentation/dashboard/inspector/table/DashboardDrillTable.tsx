import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import type { DashboardDrillRow } from "../../../../dashboards/model/dashboard-analytics";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../../localization/format/labels";
import { isPrioritySignalLevel, PrioritySignal } from "../../../cases/list/priority/PrioritySignal";
import { DetailProgress, DetailStatus } from "../../detail/records/RecordSignals";
import styles from "./table.module.css";

const safeUrl = (value: string) => {
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.href : null; }
  catch { return null; }
};
export function DashboardDrillTable({ rows, prioritySort, onPrioritySort, onOpenRow, selection, onSelection }: {
  rows: DashboardDrillRow[]; prioritySort: "asc" | "desc" | null; onPrioritySort: () => void;
  onOpenRow: (row: DashboardDrillRow) => void; selection?: Set<string>; onSelection?: (ids: Set<string>) => void;
}) {
  const { locale, languageTag, t } = useTmsLocale(); const ru = locale === "ru";
  const runs = rows[0]?.entity === "run"; const cases = rows[0]?.entity === "test_case";
  const date = (value?: string) => value && Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat(languageTag, {
    day: "numeric", month: "short",
  }).format(new Date(value)) : "—";
  const selectable = Boolean(cases && selection && onSelection);
  if (!rows.length) return null;
  return <div className={styles.viewport}><table className={styles.table} data-entity={rows[0].entity}>
    <colgroup>{selectable && <col style={{ width: 28 }} />}<col /><col style={{ width: runs ? 195 : cases ? 80 : 115 }} /><col style={{ width: 105 }} />
      {!runs && <col style={{ width: 103 }} />}{!cases && <col style={{ width: 85 }} />}<col style={{ width: 38 }} /></colgroup>
    <thead><tr>{selectable && <th className={styles.check}><input type="checkbox" aria-label={ru ? "Выбрать показанные тест-кейсы" : "Select visible test cases"}
      checked={rows.every(row => selection!.has(row.id))} onChange={event => onSelection!(event.target.checked ? new Set([...selection!, ...rows.map(row => row.id)]) : new Set([...selection!].filter(id => !rows.some(row => row.id === id))))} /></th>}
      <th scope="col">{t(runs ? "dashboard.runs" : cases ? "dashboard.testCases" : "dashboard.defects")}</th>
      <th scope="col">{runs ? (ru ? "Прогресс" : "Progress") : t(cases ? "dashboard.type" : "dashboard.component")}</th>
      <th scope="col">{t("dashboard.status")}</th>
      {!runs && <th scope="col" aria-sort={prioritySort === "asc" ? "ascending" : prioritySort === "desc" ? "descending" : "none"}>
        <button type="button" className={styles.prioritySortButton} onClick={onPrioritySort}>{t("dashboard.priority")}<ChevronDown size={12} /></button></th>}
      {!cases && <th scope="col">{t("dashboard.updated")}</th>}<th scope="col"><span className={styles.sr}>{t("dashboard.openRecord")}</span></th>
    </tr></thead>
    <tbody>{rows.map(row => {
      const external = row.links.find(link => safeUrl(link.url));
      return <tr key={`${row.projectId}:${row.entity}:${row.id}`}>
        {selectable && <td className={styles.check}><input type="checkbox" aria-label={`${ru ? "Выбрать" : "Select"} ${row.key}`} checked={selection!.has(row.id)}
          onChange={event => { const next = new Set(selection); if (event.target.checked) next.add(row.id); else next.delete(row.id); onSelection!(next); }} /></td>}
        <td className={styles.name}><button type="button" onClick={() => onOpenRow(row)} title={row.title}>
          {!runs && <span className={styles.key}>{row.caseKey ?? row.key}</span>}<strong>{row.title}</strong>
        </button></td>
        <td>{runs ? row.progress ? <DetailProgress progress={row.progress} /> : "—" : cases ? localizedLabel(locale, row.type ?? "") : row.component || "—"}</td>
        <td><DetailStatus status={row.status} /></td>
        {!runs && <td><span className={styles.priority}>{isPrioritySignalLevel(row.priority)
          ? <><PrioritySignal priority={row.priority} label={localizedLabel(locale, row.priority)} size={14} />{localizedLabel(locale, row.priority)}</> : "—"}</span></td>}
        {!cases && <td><time dateTime={row.occurredAt} title={row.occurredAt}>{date(row.occurredAt)}</time></td>}
        <td><div className={styles.actions}>{external && <a href={safeUrl(external.url)!} target="_blank" rel="noreferrer noopener" aria-label={t("dashboard.openExternalLink", { label: external.label })}><ExternalLink size={13} /></a>}
          <button type="button" aria-label={`${t("dashboard.openRecord")}: ${row.title}`} onClick={() => onOpenRow(row)}><ChevronRight size={15} /></button></div></td>
      </tr>;
    })}</tbody>
  </table></div>;
}
