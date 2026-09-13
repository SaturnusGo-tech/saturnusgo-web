import { ArrowUpRight, Bug, ShieldCheck } from "lucide-react";
import type { RunItem, TestRunSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../../localization/format/labels";
import { useRunVerificationContext } from "../../state/context/useRunVerificationContext";
import styles from "./verification-context.module.css";

export function VerificationRunContext({ run, item, connected, onOpenCaseActivity, onOpenDefect }: {
  run: TestRunSummary | null; item: RunItem | null; connected: boolean;
  onOpenCaseActivity: (caseId: string, defectId: string) => void;
  onOpenDefect: (defectId: string) => void;
}) {
  const { locale } = useTmsLocale(); const ru = locale === "ru";
  const context = useRunVerificationContext(run, item, connected);
  if (!context.enabled || !item) return null;
  const defects = [...new Map(context.items.map((entry) => [entry.defectId, entry])).values()];
  return <section className={styles.context} aria-label={ru ? "Проверяемые исправления" : "Fixes under verification"}>
    <header><ShieldCheck size={17} /><h2>{ru ? "Проверяемые исправления" : "Fixes under verification"}</h2></header>
    {context.pending && <div className={styles.loading} role="status" aria-label={ru ? "Загрузка связанных багов" : "Loading linked bugs"}>
      <i /><i />
    </div>}
    {context.error && <p className={styles.message} role="alert">
      {ru ? "Не удалось загрузить связанные баги." : "Could not load linked bugs."}
      <button type="button" onClick={() => { void context.refresh(); }}>{ru ? "Повторить" : "Retry"}</button>
    </p>}
    {!context.pending && !context.error && defects.length === 0 && <p className={styles.message}>
      {ru ? "Для этого кейса нет связанных исправлений в прогоне." : "This case has no linked fixes in this run."}
    </p>}
    {defects.map((entry) => {
      const terminal = entry.currentStatus === "verified" || entry.currentStatus === "closed";
      const unchanged = context.items.filter((other) => other.defectId === entry.defectId).every((other) => !other.readinessChanged);
      const ready = item.status === "passed" && entry.currentStatus === "ready_for_retest" && unchanged && !context.pending;
      const message = terminal ? (ru ? "Исправление уже подтверждено или баг закрыт." : "The fix is confirmed or the bug is closed.")
        : (!unchanged || entry.currentStatus !== "ready_for_retest") ? (ru ? "Статус готовности изменился. Проверьте актуальное состояние бага." : "Readiness changed. Check the current bug status.")
        : item.status === "passed" ? (ru ? "Ретест пройден. Подтвердите исправление в истории кейса." : "Retest passed. Confirm the fix in case history.")
        : item.status === "failed" ? (ru ? "Ретест не пройден. Зафиксируйте результат в баг-репорте." : "Retest failed. Record the result in the bug report.")
        : (ru ? "После успешного ретеста подтвердите исправление отдельно." : "Confirm the fix separately after a successful retest.");
      return <article className={styles.row} key={entry.defectId}>
        <Bug size={16} aria-hidden="true" />
        <div><button type="button" className={styles.link} onClick={() => onOpenDefect(entry.defectId)}>
          <strong>{entry.defectKey}</strong><span>{entry.defectTitle}</span></button>
          <small>{localizedLabel(locale, entry.currentStatus)}</small><p>{message}</p></div>
        <button type="button" className={ready ? styles.confirm : styles.open} disabled={context.pending}
          onClick={() => ready ? onOpenCaseActivity(item.caseId, entry.defectId) : onOpenDefect(entry.defectId)}>
          {ready ? <ShieldCheck size={15} /> : <ArrowUpRight size={15} />}
          {ready ? (ru ? "Подтвердить исправление" : "Confirm the fix") : (ru ? "Открыть баг-репорт" : "Open bug report")}
        </button>
      </article>;
    })}
  </section>;
}
