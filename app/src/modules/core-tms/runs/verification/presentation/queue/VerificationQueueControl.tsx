import { ChevronDown, Loader2, Play } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import type { WorkspaceVerification } from "../../state/workspace/useWorkspaceVerification";
import { VerificationQueueDialog } from "./VerificationQueueDialog";
import css from "./verification-queue.module.css";

export function VerificationQueueControl({ state, onOpenDefect }: {
  state: WorkspaceVerification; onOpenDefect: (id: string) => void;
}) {
  const { locale } = useTmsLocale();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = () => state.setExpanded(false);
  const restoreFocus = () => { close(); requestAnimationFrame(() => trigger.current?.focus()); };
  useEffect(() => {
    if (!state.expanded) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) state.setExpanded(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault(); event.stopPropagation(); state.setExpanded(false);
      requestAnimationFrame(() => trigger.current?.focus());
    };
    const focus = (event: FocusEvent) => {
      if (!root.current?.contains(event.target as Node)) state.setExpanded(false);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape, true);
    document.addEventListener("focusin", focus);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape, true);
      document.removeEventListener("focusin", focus);
    };
  }, [state.expanded, state.setExpanded]);
  const ru = locale === "ru";
  if (!state.enabled) return null;
  const label = state.pendingStart ? (ru ? "Открываем прогон…" : "Opening run…")
    : state.unresolved ? (ru ? "Повторить запуск" : "Retry verification")
    : (ru ? "Проверить исправления" : "Verify fixes");
  const count = state.data?.totalCases;
  const compactLabel = state.pendingStart ? (ru ? "Открываем…" : "Opening…")
    : state.unresolved ? (ru ? "Повторить" : "Retry") : (ru ? "Проверить" : "Verify");
  return <div className={css.control} ref={root}>
    <div className={css.triggerGroup} data-open={state.expanded || undefined}>
      <button type="button" className={css.start} disabled={Boolean(state.disabledReason) || state.pendingStart}
        title={state.disabledReason || (ru ? "Открыть прогон по всем связанным кейсам на проверку" : "Open a run with all linked cases waiting for QA")}
        aria-label={`${label}${count !== undefined ? ` · ${count}` : ""}`} onClick={() => { void state.start(); }}>
        {state.pendingStart ? <Loader2 size={14} className={css.spinner} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
        <span className={css.buttonLabel}>{label}</span><span className={css.compactLabel}>{compactLabel}</span><b>{count ?? "—"}</b>
      </button>
      <button ref={trigger} type="button" className={css.expand} onClick={() => state.setExpanded(!state.expanded)}
        title={ru ? "Очередь проверки исправлений" : "Fix verification queue"}
        aria-label={ru ? "Посмотреть исправления на проверку" : "Review fixes waiting for QA"}
        aria-haspopup="dialog" aria-expanded={state.expanded}>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
    </div>
    <AnimatePresence initial={false}>
      {state.expanded && <VerificationQueueDialog key="verification-queue" state={state} ru={ru}
        onClose={restoreFocus} onOpenDefect={(id) => { close(); onOpenDefect(id); }} />}
    </AnimatePresence>
  </div>;
}
