import { AlertTriangle, Bug, ChevronDown, RefreshCw } from "lucide-react";
import { useState } from "react";
import { localizedLabel } from "../../../../localization/format/labels";
import { useRunVerification } from "../../state/useRunVerification";
import css from "./run-verification.module.css";

export function RunVerificationPanel({ runId, caseId, caseKey, enabled, ru, onOpenDefect }: {
  runId: string; caseId: string | null; caseKey: string | null;
  enabled: boolean; ru: boolean; onOpenDefect: (id: string) => void;
}) {
  const resource = useRunVerification(runId, caseId, enabled, ru);
  const [expanded, setExpanded] = useState(false);
  if (!enabled || (!resource.error && !resource.entries.length)) return null;
  const uniqueBugs = new Set(resource.entries.map((entry) => entry.defectId)).size;
  const changed = resource.entries.some((entry) => entry.readinessChanged);
  return <section className={css.panel} aria-label={ru ? "Исправления в прогоне" : "Fixes in this run"}>
    <header>
      <button type="button" className={css.toggle} aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
        <Bug size={14} aria-hidden="true" /><strong>{ru ? "Проверка исправлений" : "Fix verification"}</strong>
        {caseKey && <span>{caseKey}</span>}
        {uniqueBugs > 0 && <b>{uniqueBugs}</b>}
        <ChevronDown size={14} className={expanded ? css.openChevron : undefined} aria-hidden="true" />
      </button>
      {changed && <span className={css.warning}><AlertTriangle size={13} />{ru ? "Статусы изменились" : "Statuses changed"}</span>}
      <button type="button" className={css.refresh} disabled={resource.pending} onClick={() => { void resource.refresh(); }}
        aria-label={ru ? "Обновить исправления" : "Refresh fixes"} title={ru ? "Обновить исправления" : "Refresh fixes"}>
        <RefreshCw size={13} className={resource.pending ? css.spinner : undefined} />
      </button>
    </header>
    {resource.error && <p className={css.error} role="alert">{resource.error}</p>}
    {expanded && <div className={css.content} aria-busy={resource.pending}>
      {resource.pending && !resource.entries.length && <p role="status">{ru ? "Загружаем связанные баги…" : "Loading linked bugs…"}</p>}
      {resource.entries.map((entry) => <div key={`${entry.defectId}:${entry.occurrenceId}`} className={css.entry}>
        <button type="button" onClick={() => onOpenDefect(entry.defectId)}>
          <strong>{entry.defectKey}</strong><span>{entry.defectTitle}</span>
        </button>
        <span className={css.status} data-status={entry.currentStatus}>{localizedLabel(ru ? "ru" : "en", entry.currentStatus)}</span>
        {entry.stepAction && <p>{entry.stepAction}</p>}
        {entry.readinessChanged && <p className={css.warning}>{ru
          ? "Готовность бага изменилась после создания прогона. Перед проверкой уточните актуальное состояние."
          : "The bug readiness changed after this run was created. Check its current state before testing."}</p>}
      </div>)}
      {resource.entries.length > 0 && <p className={css.note}>{ru
        ? "Связи сохранены при создании прогона. После ретеста подтвердите исправление в карточке кейса."
        : "Links were saved when the run was created. After retesting, confirm the fix in the case details."}</p>}
    </div>}
  </section>;
}
