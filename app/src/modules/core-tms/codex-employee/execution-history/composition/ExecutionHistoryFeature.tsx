"use client";
import { History, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { useAnchoredPopup } from "../../../presentation/common/popup/useAnchoredPopup";
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
  const root = useRef<HTMLDivElement>(null), panel = useRef<HTMLDivElement>(null), closeButton = useRef<HTMLButtonElement>(null);
  const dismiss = useCallback(() => setOpen(false), []);
  useAnchoredPopup(open, false, root, trigger, panel, dismiss, 420);
  useEffect(() => { if (open) closeButton.current?.focus({ preventScroll: true }); }, [open]);
  const close = () => { dismiss(); trigger.current?.focus({ preventScroll: true }); };
  const filtered = allAttempts || Boolean(stepId);
  const showFilters = attemptNo > 1 || filtered || state.items.length > 0;
  const label = ru ? "История выполнения" : "Execution history";
  return <div ref={root} className={styles.history} onKeyDown={event => {
    if (event.key === "Escape" && open && !event.defaultPrevented) { event.preventDefault(); event.stopPropagation(); close(); }
  }} onBlur={event => {
    if (event.relatedTarget && !root.current?.contains(event.relatedTarget as Node)) dismiss();
  }}>
    <button type="button" ref={trigger} className={styles.toggle} aria-label={label} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen(value => !value)}>
      <History size={16} strokeWidth={1.5} aria-hidden="true" />
    </button>
    {open && <div ref={panel} id={id} className={styles.panel} popover="manual" role="dialog" aria-labelledby={`${id}-title`}>
      <header className={styles.header}><h2 id={`${id}-title`}>{label}</h2>
        <button type="button" ref={closeButton} className={styles.close} onClick={close} aria-label={ru ? "Закрыть историю выполнения" : "Close execution history"}><X size={16} aria-hidden="true" /></button>
      </header>
      <div className={styles.content}>
        {offline ? <p className={styles.hint}>{ru ? "Подключитесь, чтобы посмотреть историю." : "Connect to view history."}</p> : <>
          {showFilters && <div className={styles.filters}>
            <AnimatedSelect compact label={ru ? "Попытка" : "Attempt"} value={allAttempts ? "all" : "current"}
              options={[{ value: "current", label: `${ru ? "Попытка" : "Attempt"} ${attemptNo}` }, { value: "all", label: ru ? "Все попытки" : "All attempts" }]}
              onChange={value => setAllAttempts(value === "all")} />
            {steps.length > 0 && <AnimatedSelect compact label={ru ? "Шаг" : "Step"} value={stepId}
              options={[{ value: "", label: ru ? "Все записи" : "All activity" }, ...steps.map(step => ({ value: step.id, label: `${ru ? "Шаг" : "Step"} ${step.order}` }))]}
              onChange={setStepId} />}
          </div>}
          <ExecutionHistory state={state} locale={locale} workspaceId={scope.workspaceId} steps={steps} filtered={filtered} />
        </>}
      </div>
    </div>}
  </div>;
}
