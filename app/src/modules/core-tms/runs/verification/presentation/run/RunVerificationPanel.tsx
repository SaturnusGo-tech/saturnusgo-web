import { AlertCircle, Bug, ChevronRight, RefreshCw } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useId, useState } from "react";
import { localizedLabel } from "../../../../localization/format/labels";
import { useRunVerification } from "../../state/useRunVerification";
import css from "./run-verification.module.css";

export function RunVerificationPanel({ runId, caseId, caseKey, enabled, ru, onOpenDefect }: {
  runId: string; caseId: string | null; caseKey: string | null;
  enabled: boolean; ru: boolean; onOpenDefect: (id: string) => void;
}) {
  const resource = useRunVerification(runId, caseId, enabled, ru);
  const [expanded, setExpanded] = useState(false);
  const reduced = useReducedMotion();
  const contentId = useId();
  if (!enabled || (!resource.pending && !resource.error && !resource.entries.length)) return null;
  const uniqueBugs = new Set(resource.entries.map((entry) => entry.defectId)).size;
  const changed = resource.entries.some((entry) => entry.readinessChanged);
  return <section className={css.panel} aria-label={ru ? "Исправления в прогоне" : "Fixes in this run"}>
    <header className={css.heading}>
      <button type="button" className={css.toggle} aria-expanded={expanded} aria-controls={contentId}
        title={caseKey ?? undefined} onClick={() => setExpanded(!expanded)}>
        <ChevronRight size={13} className={expanded ? css.openChevron : undefined} aria-hidden="true" />
        <span>{ru ? "Связанные исправления" : "Linked fixes"}</span><b>{uniqueBugs || "—"}</b>
      </button>
      {changed && <span className={css.changed}><AlertCircle size={12} aria-hidden="true" />{ru ? "Есть изменения статуса" : "Status changed"}</span>}
      <button type="button" className={css.refresh} disabled={resource.pending} onClick={() => { void resource.refresh(); }}
        aria-label={ru ? "Обновить исправления" : "Refresh fixes"} title={ru ? "Обновить исправления" : "Refresh fixes"}>
        <RefreshCw size={12} className={resource.pending ? css.spinner : undefined} />
      </button>
    </header>
    {resource.error && <p className={css.error} role="alert">{resource.error}</p>}
    <AnimatePresence initial={false}>
      {expanded && <motion.div id={contentId} key="linked-fixes" className={css.reveal}
        initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
        transition={{ height: { duration: reduced ? 0 : .2, ease: [.2, .72, .3, 1] }, opacity: { duration: reduced ? 0 : .14 } }}>
        <div className={css.content} aria-busy={resource.pending}>
          {resource.pending && !resource.entries.length && <p role="status">{ru ? "Загружаем связанные баги…" : "Loading linked bugs…"}</p>}
          <ul>{resource.entries.map((entry) => <li key={`${entry.defectId}:${entry.occurrenceId}`} className={css.entry}>
            <button type="button" className={css.bugLink} onClick={() => onOpenDefect(entry.defectId)} title={entry.defectTitle}>
              <Bug size={13} aria-hidden="true" /><strong>{entry.defectKey}</strong><span>{entry.defectTitle}</span>
            </button>
            <span className={css.status} data-status={entry.currentStatus}><i aria-hidden="true" />{localizedLabel(ru ? "ru" : "en", entry.currentStatus)}</span>
            {entry.stepAction && <p className={css.step}>{entry.stepAction}</p>}
            {entry.readinessChanged && <p className={css.warning}>{ru
              ? "Статус изменился после создания прогона. Уточните готовность перед проверкой."
              : "Status changed after the run was created. Check readiness before testing."}</p>}
          </li>)}</ul>
          {resource.entries.length > 0 && <p className={css.note}>{ru
            ? "После ретеста подтвердите исправление в карточке кейса."
            : "After retesting, confirm the fix in the case details."}</p>}
        </div>
      </motion.div>}
    </AnimatePresence>
  </section>;
}
