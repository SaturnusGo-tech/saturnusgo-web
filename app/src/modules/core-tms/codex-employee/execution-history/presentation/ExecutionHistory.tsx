import React from "react";
import type { useExecutionHistory } from "../application/useExecutionHistory";
import { ResponsibleName } from "../../../workspace/members/presentation/ResponsibleName";
import { localizedLabel } from "../../../localization/format/labels";
import styles from "./execution-history.module.css";
export function ExecutionHistory({ state, locale, workspaceId, steps }: {
    state: ReturnType<typeof useExecutionHistory>;
    locale: "en" | "ru";
    workspaceId: string;
    steps: readonly {
        id: string;
        order: number;
    }[];
}) {
    const ru = locale === "ru";
    return <div className={styles.body}>
    <p>{ru ? "Авторы отдельных записей. Назначение и начало ретеста не подтверждают выполнение." : "Authors of individual records. Assignment and starting a retest do not prove execution."}</p>
    {state.loading && <p role="status">{ru ? "Загрузка истории…" : "Loading history…"}</p>}
    {state.error && <div role="alert">{ru ? "История недоступна." : "History unavailable."} <button type="button" onClick={state.refresh}>{ru ? "Повторить" : "Retry"}</button></div>}
    {!state.loading && !state.error && !state.items.length && <p>{ru ? "Записей выполнения нет. Автор результата неизвестен." : "No execution records. Result author is unknown."}</p>}
    <ol>{state.items.map(event => <li key={event.id}>
      <div className={styles.event}><strong>{event.kind === "result_recorded" ? (ru ? "Результат записал" : "Result recorded by") : event.kind === "step_result_recorded" ? (ru ? "Результат шага записал" : "Step result recorded by") : (ru ? "Ретест начал" : "Retest started by")}</strong>
        {event.actorIdentityId ? <ResponsibleName workspaceId={workspaceId} identityId={event.actorIdentityId}/> : <span>{event.actor}</span>}
      </div>
      <div className={styles.meta}><span>{ru ? "Попытка" : "Attempt"} {event.attemptNo}</span>
        {event.stepId && <span>{ru ? "Шаг" : "Step"} {steps.find(step => step.id === event.stepId)?.order ?? event.stepId}</span>}
        <span>{localizedLabel(locale, event.status)}</span><time dateTime={event.createdAt}>{new Date(event.createdAt).toLocaleString(locale)}</time></div>
      {event.initiatedBy && <details><summary>{ru ? "Подробности" : "Details"}</summary><p>{ru ? "Инициатор" : "Initiated by"}: {event.initiatedBy.name}</p></details>}
    </li>)}</ol>
    {state.nextCursor && <button type="button" disabled={state.pending} onClick={() => void state.more()}>{ru ? "Загрузить ещё записи" : "Load more records"}</button>}
  </div>;
}
