import React from "react";
import type { useExecutionHistory } from "../application/useExecutionHistory";
import { ResponsibleName } from "../../../workspace/members/presentation/ResponsibleName";
import { localizedLabel } from "../../../localization/format/labels";
import { ErrorToast } from "../../../presentation/common/error/ErrorToast";
import styles from "./execution-history.module.css";

export function ExecutionHistory({ state, locale, workspaceId, steps, filtered = false }: {
  state: ReturnType<typeof useExecutionHistory>; locale: "en" | "ru"; workspaceId: string;
  steps: readonly { id: string; order: number }[]; filtered?: boolean;
}) {
  const ru = locale === "ru";
  return <div className={styles.body} aria-busy={state.loading}>
    {state.loading && <p className={styles.hint} role="status">{ru ? "Загрузка истории…" : "Loading history…"}</p>}
    <ErrorToast message={state.error ? (ru ? "Не удалось загрузить историю." : "Could not load history.") : null}
      retryLabel={ru ? "Повторить" : "Retry"} onRetry={state.refresh} />
    {!state.loading && !state.error && !state.items.length && <p className={styles.hint}>{ru
      ? filtered ? "Подходящих записей нет." : "Записей выполнения пока нет."
      : filtered ? "No matching records." : "No execution activity yet."}</p>}
    {state.items.length > 0 && <ol className={styles.events}>{state.items.map(event => <li key={event.id}>
      <div className={styles.event}><strong>{event.kind === "result_recorded" ? (ru ? "Результат записал" : "Result recorded by")
        : event.kind === "step_result_recorded" ? (ru ? "Результат шага записал" : "Step result recorded by") : (ru ? "Ретест начал" : "Retest started by")}</strong>
        {event.actorIdentityId ? <ResponsibleName workspaceId={workspaceId} identityId={event.actorIdentityId} /> : <span>{event.actor}</span>}
        <span className={styles.status} data-status={event.status}>{localizedLabel(locale, event.status)}</span>
      </div>
      <div className={styles.meta}><span>{ru ? "Попытка" : "Attempt"} {event.attemptNo}</span>
        {event.stepId && <span>{ru ? "Шаг" : "Step"} {steps.find(step => step.id === event.stepId)?.order ?? event.stepId}</span>}
        <time dateTime={event.createdAt}>{new Date(event.createdAt).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })}</time>
        {event.initiatedBy && <span>{ru ? "Инициатор" : "Initiated by"}: {event.initiatedBy.name}</span>}
      </div>
    </li>)}</ol>}
    {state.nextCursor && <button type="button" className={styles.more} disabled={state.pending} aria-busy={state.pending} onClick={() => void state.more()}>
      {state.pending ? (ru ? "Загрузка…" : "Loading…") : (ru ? "Загрузить ещё записи" : "Load more records")}
    </button>}
  </div>;
}
