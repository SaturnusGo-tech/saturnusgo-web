import { GitBranch, Loader2, Play, RefreshCw, Server, X } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useRef } from "react";
import type { WorkspaceVerification } from "../../state/workspace/useWorkspaceVerification";
import { VerificationQueueEntries } from "../entries/VerificationQueueEntries";
import css from "./verification-queue.module.css";

export function VerificationQueueDialog({ state, ru, onClose, onOpenDefect }: {
  state: WorkspaceVerification; ru: boolean; onClose: () => void; onOpenDefect: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const reduced = useReducedMotion();
  useEffect(() => { const frame = requestAnimationFrame(() => ref.current?.focus());
    return () => cancelAnimationFrame(frame); }, []);
  const count = state.data?.totalCases ?? 0;
  const bugs = state.data?.totalDefects ?? 0;
  const blocked = state.data?.blockedEntries ?? 0;
  const noun = (value: number, singular: string, few: string, many: string) => {
    const rule = new Intl.PluralRules(ru ? "ru" : "en").select(value);
    return rule === "one" ? singular : rule === "few" ? few : many;
  };
  return <motion.div ref={ref} className={css.dialog} role="dialog" aria-labelledby={titleId} tabIndex={-1}
    initial={{ opacity: 0, y: reduced ? 0 : -5, scale: reduced ? 1 : .99 }}
    animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: reduced ? 0 : -3, scale: reduced ? 1 : .995 }}
    transition={{ duration: reduced ? 0 : .16, ease: [.2, .72, .3, 1] }}>
    <header className={css.dialogHeader}>
      <h2 id={titleId}>{ru ? "Исправления на проверку" : "Fixes waiting for QA"}</h2>
      <button type="button" disabled={state.pending} onClick={() => { void state.refresh(); }}
        aria-label={ru ? "Обновить очередь" : "Refresh queue"} title={ru ? "Обновить очередь" : "Refresh queue"}>
        <RefreshCw size={13} className={state.pending ? css.spinner : undefined} /></button>
      <button type="button" onClick={onClose} aria-label={ru ? "Закрыть очередь" : "Close queue"}><X size={14} /></button>
    </header>
    <p className={css.summary}>
      <span>{count} {ru ? noun(count, "кейс", "кейса", "кейсов") : noun(count, "case", "cases", "cases")}</span>
      <span aria-hidden="true">·</span>
      <span>{bugs} {ru ? noun(bugs, "баг", "бага", "багов") : noun(bugs, "bug", "bugs", "bugs")}</span>
      {blocked > 0 && <><span aria-hidden="true">·</span>
        <span className={css.blocked}>{blocked} {ru ? noun(blocked, "требует внимания", "требуют внимания", "требуют внимания")
          : noun(blocked, "needs attention", "need attention", "need attention")}</span></>}
    </p>
    <div className={css.entries} aria-busy={state.pending}>
      {state.error && <p className={css.error} role="alert">{state.error}</p>}
      {state.pending && !state.complete && <p className={css.empty} role="status">{ru ? "Загружаем полную очередь…" : "Loading the full queue…"}</p>}
      {state.complete && state.data && <VerificationQueueEntries entries={state.data.entries} ru={ru} onOpenDefect={onOpenDefect} />}
      {state.complete && !state.data?.entries.length && <p className={css.empty}>
        {ru ? "Пока нет исправлений на проверку. Они появятся после обновления статусов багов."
          : "No fixes are waiting for QA. They will appear when bug statuses change."}</p>}
    </div>
    <div className={css.target}>
      <label><Server size={13} aria-hidden="true" /><span>{ru ? "Окружение" : "Environment"}</span>
        <select value={state.environmentId} disabled={state.pendingStart || state.unresolved}
          onChange={(event) => state.setEnvironment(event.target.value)}>
          <option value="">{ru ? "Выберите окружение" : "Choose environment"}</option>
          {state.unresolved && !state.environments.some((env) => env.id === state.environmentId) &&
            <option value={state.environmentId}>{ru ? "Окружение прежнего запроса" : "Previous request environment"}</option>}
          {state.environments.map((env) => <option key={env.id} value={env.id}>{env.name}</option>)}
        </select></label>
      <label><GitBranch size={13} aria-hidden="true" /><span>{ru ? "Сборка" : "Build"}</span>
        <input value={state.build} maxLength={500} disabled={state.pendingStart || state.unresolved}
          onChange={(event) => state.setBuild(event.target.value)} /></label>
    </div>
    <footer className={css.footer}>
      {state.startError && <p className={css.error} role="alert">{state.startError}</p>}
      {state.unresolved && <p className={css.note}>{ru ? "Повтор сохранит состав, окружение и сборку прежнего запроса."
        : "Retry keeps the previous scope, environment and build."}</p>}
      {state.disabledReason && <p className={css.note}>{state.disabledReason}</p>}
      <div className={css.footerActions}>
        <span title={ru ? "Связанные кейсы попадут в один прогон без повторов. Баги закрываются после подтверждения QA."
          : "Linked cases enter one run without duplicates. QA confirms fixes before bugs are closed."}>
          {ru ? "Без повторов кейсов" : "Each case once"}</span>
        <button type="button" className={css.primary} disabled={Boolean(state.disabledReason) || state.pendingStart}
          onClick={() => { void state.start(); }}>
          {state.pendingStart ? <Loader2 size={13} className={css.spinner} aria-hidden="true" /> : <Play size={13} aria-hidden="true" />}
          {state.pendingStart ? (ru ? "Открываем…" : "Opening…") : state.unresolved
            ? (ru ? "Повторить запуск" : "Retry verification") : (ru ? "Открыть прогон" : "Open run")}
        </button>
      </div>
    </footer>
  </motion.div>;
}
