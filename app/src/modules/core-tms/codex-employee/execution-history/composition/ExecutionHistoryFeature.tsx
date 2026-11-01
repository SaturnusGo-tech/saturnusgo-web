"use client";
import { useState } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { useExecutionHistory } from "../application/useExecutionHistory";
import { ExecutionHistory } from "../presentation/ExecutionHistory";
import type { ExecutionHistoryScope } from "../domain/execution-history";
import styles from "../presentation/execution-history.module.css";
export function ExecutionHistoryFeature({ scope, attemptNo, version, steps, offline }: {
    scope: ExecutionHistoryScope;
    attemptNo: number;
    version?: number;
    steps: readonly {
        id: string;
        order: number;
    }[];
    offline: boolean;
}) {
    const http = useTmsHttpClient();
    const { locale } = useTmsLocale();
    const ru = locale === "ru";
    const [open, setOpen] = useState(false);
    const [allAttempts, setAllAttempts] = useState(false);
    const [stepId, setStepId] = useState("");
    const state = useExecutionHistory(http, { ...scope, ...(!allAttempts ? { attemptNo } : {}), ...(stepId ? { stepId } : {}) }, open && !offline, version);
    return <details className={styles.history} onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>{ru ? "История выполнения и авторы" : "Execution history and authors"}</summary>
    {offline ? <p>{ru ? "История доступна при подключении." : "Connect to view history."}</p> : <>
      <div className={styles.filters}>
        <label>{ru ? "Попытка" : "Attempt"}<select value={allAttempts ? "all" : "current"} onChange={event => setAllAttempts(event.target.value === "all")}>
          <option value="current">{ru ? "Текущая" : "Current"} ({attemptNo})</option><option value="all">{ru ? "Все попытки" : "All attempts"}</option>
        </select></label>
        <label>{ru ? "Шаг" : "Step"}<select value={stepId} onChange={event => setStepId(event.target.value)}>
          <option value="">{ru ? "Все записи" : "All records"}</option>{steps.map(step => <option key={step.id} value={step.id}>{step.order}</option>)}
        </select></label>
      </div>
      <ExecutionHistory state={state} locale={locale} workspaceId={scope.workspaceId} steps={steps}/>
    </>}
  </details>;
}
