import { AlertCircle, ArrowRight, Bug, FileCheck2 } from "lucide-react";
import type { VerificationBlockedReason, VerificationEntry } from "../../model/verification";
import css from "./verification-entries.module.css";

export function verificationBlockedLabel(reason: VerificationBlockedReason, ru: boolean) {
  return ({ no_linked_case: ru ? "Нет связанного тест-кейса" : "No linked test case",
    case_unavailable: ru ? "Кейс недоступен или в архиве" : "Case unavailable or archived",
    step_missing: ru ? "Исходного шага больше нет в кейсе" : "The original step is no longer in the case" })[reason];
}
export function VerificationQueueEntries({ entries, ru, onOpenDefect }: {
  entries: VerificationEntry[]; ru: boolean; onOpenDefect: (id: string) => void;
}) {
  const available = entries.filter((entry) => !entry.blockedReason);
  const blocked = entries.filter((entry) => entry.blockedReason);
  const groups = [
    { title: ru ? "Войдут в прогон" : "Included in the run", entries: available },
    { title: ru ? "Нужно связать или обновить кейс" : "Link or update a case first", entries: blocked },
  ];
  return <div className={css.groups}>{groups.filter((group) => group.entries.length > 0).map((group) =>
    <section key={group.title} className={css.group}>
      <h3>{group.title}<span>{group.entries.length}</span></h3>
      <ul>{group.entries.map((entry) => <li key={`${entry.defectId}:${entry.occurrenceId ?? "unlinked"}`}
        className={css.entry} data-blocked={Boolean(entry.blockedReason) || undefined}>
        <button type="button" className={css.defect} onClick={() => onOpenDefect(entry.defectId)}>
          <Bug size={13} aria-hidden="true" /><strong>{entry.defectKey}</strong><span>{entry.defectTitle}</span>
          <ArrowRight size={13} aria-hidden="true" />
        </button>
        {entry.caseId && <p className={css.case}><FileCheck2 size={13} aria-hidden="true" />
          <strong>{entry.caseKey}</strong><span>{entry.caseTitle}</span></p>}
        {entry.stepAction && <p className={css.step}>{entry.stepAction}</p>}
        {entry.blockedReason && <p className={css.warning}><AlertCircle size={13} aria-hidden="true" />
          {verificationBlockedLabel(entry.blockedReason, ru)}</p>}
      </li>)}</ul>
    </section>)}</div>;
}
