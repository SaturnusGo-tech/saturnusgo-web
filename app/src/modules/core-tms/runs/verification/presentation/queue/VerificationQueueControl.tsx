import { ChevronLeft, Loader2, Play, X } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import type { WorkspaceVerification } from "../../state/workspace/useWorkspaceVerification";
import { useVerificationLauncher } from "../../state/launcher/useVerificationLauncher";
import { showVerificationControl } from "./visibility";
import css from "./verification-queue.module.css";

export function VerificationQueueControl({ state, workspaceId }: { state: WorkspaceVerification; workspaceId: string }) {
  const { locale } = useTmsLocale();
  const { ready, collapsed, setCollapsed } = useVerificationLauncher(workspaceId);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreRef = useRef<HTMLButtonElement>(null);
  const focusAfterToggle = useRef(false);
  useLayoutEffect(() => {
    if (!focusAfterToggle.current) return;
    (collapsed ? restoreRef : closeRef).current?.focus({ preventScroll: true });
    focusAfterToggle.current = false;
  }, [collapsed]);
  if (!ready || !showVerificationControl(state)) return null;
  const ru = locale === "ru";
  const label = ru ? "Проверить исправления" : "Verify fixes";
  const hideLabel = ru ? "Скрыть проверку исправлений" : "Hide verify fixes";
  const restoreLabel = ru ? "Показать проверку исправлений" : "Show verify fixes";
  function toggle(next: boolean) { focusAfterToggle.current = true; setCollapsed(next); }
  return <div className={css.dock} data-collapsed={collapsed} data-verification-dock>
    <div className={css.launcher} aria-hidden={collapsed}>
      <button ref={closeRef} type="button" className={css.close} tabIndex={collapsed ? -1 : 0}
        title={hideLabel} aria-label={hideLabel} onClick={() => toggle(true)}>
        <X size={13} strokeWidth={1.7} aria-hidden="true" />
      </button>
      <button type="button" className={css.start} tabIndex={collapsed ? -1 : 0}
        disabled={Boolean(state.disabledReason) || state.pendingStart || state.pending}
        title={state.disabledReason || (ru ? "Открыть прогон по всем связанным кейсам на проверку" : "Open a run with all linked cases waiting for QA")}
        aria-busy={state.pendingStart || undefined} onClick={() => { void state.start(); }}>
        {state.pendingStart ? <Loader2 size={14} className={css.spinner} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
        <span>{label}</span>
      </button>
    </div>
    <button ref={restoreRef} type="button" className={css.restore} tabIndex={collapsed ? 0 : -1}
      aria-hidden={!collapsed} aria-label={restoreLabel} title={restoreLabel} aria-expanded={false}
      onClick={() => toggle(false)}>
      <ChevronLeft size={17} strokeWidth={1.7} aria-hidden="true" />
    </button>
  </div>;
}
