import { Loader2, Play, RefreshCw, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import type { WorkspaceVerification } from "../../state/workspace/useWorkspaceVerification";
import { VerificationQueueEntries } from "../entries/VerificationQueueEntries";
import css from "./verification-queue.module.css";

export function VerificationQueueDialog({ state, ru, onOpenDefect }: {
  state: WorkspaceVerification; ru: boolean; onOpenDefect: (id: string) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (state.expanded && !ref.current?.open) ref.current?.showModal();
    if (!state.expanded && ref.current?.open) ref.current?.close();
  }, [state.expanded]);
  const close = () => state.setExpanded(false);
  const count = state.data?.totalCases ?? 0;
  const bugs = state.data?.totalDefects ?? 0;
  const noun = (value: number, singular: string, few: string, many: string) => {
    const rule = new Intl.PluralRules(ru ? "ru" : "en").select(value);
    return rule === "one" ? singular : rule === "few" ? few : many;
  };
  return <dialog ref={ref} className={css.dialog} aria-labelledby={titleId}
    onCancel={close} onClose={close} onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
    <div className={css.dialogBody}>
      <header className={css.dialogHeader}>
        <div><h2 id={titleId}>{ru ? "Проверка исправлений" : "Fix verification"}</h2>
          <p>{ru ? "Все связанные кейсы будут собраны в один прогон." : "All linked cases will be collected in one run."}</p></div>
        <button type="button" onClick={close} aria-label={ru ? "Закрыть очередь" : "Close queue"}><X size={17} /></button>
      </header>
      <div className={css.summary}>
        <span><b>{count}</b>{ru ? noun(count, "кейс", "кейса", "кейсов") : noun(count, "case", "cases", "cases")}</span>
        <span><b>{bugs}</b>{ru ? noun(bugs, "баг", "бага", "багов") : noun(bugs, "bug", "bugs", "bugs")}</span>
        {Boolean(state.data?.blockedEntries) && <span className={css.blocked}><b>{state.data?.blockedEntries}</b>{ru ? "требуют внимания" : "need attention"}</span>}
        <button type="button" disabled={state.pending} onClick={() => { void state.refresh(); }}
          aria-label={ru ? "Обновить очередь" : "Refresh queue"} title={ru ? "Обновить очередь" : "Refresh queue"}>
          <RefreshCw size={14} className={state.pending ? css.spinner : undefined} /></button>
      </div>
      <div className={css.target}>
        <label>{ru ? "Окружение" : "Environment"}<select value={state.environmentId}
          disabled={state.pendingStart || state.unresolved} onChange={(event) => state.setEnvironment(event.target.value)}>
          <option value="">{ru ? "Выберите окружение" : "Choose environment"}</option>
          {state.unresolved && !state.environments.some((env) => env.id === state.environmentId) &&
            <option value={state.environmentId}>{ru ? "Окружение прежнего запроса" : "Previous request environment"}</option>}
          {state.environments.map((env) => <option key={env.id} value={env.id}>{env.name}</option>)}
        </select></label>
        <label>{ru ? "Сборка" : "Build"}<input value={state.build} maxLength={500}
          disabled={state.pendingStart || state.unresolved} onChange={(event) => state.setBuild(event.target.value)} /></label>
      </div>
      <div className={css.entries} aria-busy={state.pending}>
        {state.error && <p className={css.error} role="alert">{state.error}</p>}
        {state.pending && !state.complete && <p className={css.empty} role="status">{ru ? "Загружаем полную очередь…" : "Loading the full queue…"}</p>}
        {state.complete && state.data && <VerificationQueueEntries entries={state.data.entries} ru={ru}
          onOpenDefect={(id) => { close(); onOpenDefect(id); }} />}
        {state.complete && !state.data?.entries.length && <p className={css.empty}>
          {ru ? "Пока нет исправлений на проверку. Они появятся после обновления статуса связанных багов."
            : "No fixes are waiting for QA. They will appear when linked bug statuses change."}</p>}
      </div>
      <footer className={css.footer}>
        {state.startError && <p className={css.error} role="alert">{state.startError}</p>}
        {state.unresolved && <p>{ru ? "Повторный запуск продолжит прежний запрос с сохранённым составом, окружением и сборкой."
          : "Retrying continues the previous request with its saved scope, environment and build."}</p>}
        {state.disabledReason && <p>{state.disabledReason}</p>}
        <p>{ru ? "Кейс попадёт в прогон один раз, даже если с ним связано несколько багов. Проверка не закрывает баги автоматически."
          : "Each case appears once, even when linked to several bugs. Verification does not close bugs automatically."}</p>
        <button type="button" className={css.primary} disabled={Boolean(state.disabledReason) || state.pendingStart}
          onClick={() => { void state.start(); }}>
          {state.pendingStart ? <Loader2 size={14} className={css.spinner} /> : <Play size={14} />}
          {state.pendingStart ? (ru ? "Открываем…" : "Opening…") : state.unresolved
            ? (ru ? "Повторить запуск" : "Retry verification") : (ru ? "Открыть прогон" : "Open run")}
        </button>
      </footer>
    </div>
  </dialog>;
}
