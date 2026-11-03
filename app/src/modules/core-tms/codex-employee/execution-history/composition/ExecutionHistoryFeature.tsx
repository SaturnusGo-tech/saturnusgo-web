"use client";
import { ChevronDown, History } from "lucide-react";
import { useId, useRef, useState } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { AnimatedSelect } from "../../../presentation/common/select/AnimatedSelect";
import { useExecutionHistory } from "../application/useExecutionHistory";
import { ExecutionHistory } from "../presentation/ExecutionHistory";
import type { ExecutionHistoryScope } from "../domain/execution-history";
import styles from "../presentation/execution-history.module.css";

export function ExecutionHistoryFeature({ scope, attemptNo, version, steps, offline }: {
  scope: ExecutionHistoryScope; attemptNo: number; version?: number;
  steps: readonly { id: string; order: number }[]; offline: boolean;
}) {
  const http = useTmsHttpClient(); const { locale } = useTmsLocale(); const ru = locale === "ru";
  const [open, setOpen] = useState(false), [allAttempts, setAllAttempts] = useState(false), [stepId, setStepId] = useState("");
  const id = useId(), trigger = useRef<HTMLButtonElement>(null);
  const state = useExecutionHistory(http, { ...scope, ...(!allAttempts ? { attemptNo } : {}), ...(stepId ? { stepId } : {}) }, open && !offline, version);
  // Closing retains the visible records while the reveal contracts; requests still cancel immediately.
  const lastOpen = useRef(state); if (open) lastOpen.current = state;
  const visible = open ? state : lastOpen.current;
  const filtered = allAttempts || Boolean(stepId);
  const showFilters = attemptNo > 1 || filtered || visible.items.length > 0;
  const label = ru ? "История выполнения" : "Execution history";
  return <section className={styles.history} onKeyDown={event => {
    if (event.key === "Escape" && open && !event.defaultPrevented) { event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus(); }
  }}>
    <button type="button" ref={trigger} className={styles.toggle} aria-label={label} aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)}>
      <History size={15} strokeWidth={1.5} /><span>{label}</span>
      <ChevronDown className={styles.chevron} size={14} data-open={open} />
    </button>
    <div id={id} className={styles.reveal} data-open={open} aria-hidden={!open} inert={!open}>
      <div><div className={styles.content}>
        {offline ? <p className={styles.hint}>{ru ? "Подключитесь, чтобы посмотреть историю." : "Connect to view history."}</p> : <>
          {showFilters && <div className={styles.filters}>
            <AnimatedSelect compact label={ru ? "Попытка" : "Attempt"} value={allAttempts ? "all" : "current"}
              options={[{ value: "current", label: `${ru ? "Попытка" : "Attempt"} ${attemptNo}` }, { value: "all", label: ru ? "Все попытки" : "All attempts" }]}
              onChange={value => setAllAttempts(value === "all")} />
            {steps.length > 0 && <AnimatedSelect compact label={ru ? "Шаг" : "Step"} value={stepId}
              options={[{ value: "", label: ru ? "Все записи" : "All activity" }, ...steps.map(step => ({ value: step.id, label: `${ru ? "Шаг" : "Step"} ${step.order}` }))]}
              onChange={setStepId} />}
          </div>}
          <ExecutionHistory state={visible} locale={locale} workspaceId={scope.workspaceId} steps={steps} filtered={filtered} />
        </>}
      </div></div>
    </div>
  </section>;
}
