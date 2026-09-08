import { Loader2, Play } from "lucide-react";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import type { WorkspaceVerification } from "../../state/workspace/useWorkspaceVerification";
import css from "./verification-queue.module.css";

export function VerificationQueueControl({ state }: { state: WorkspaceVerification }) {
  const { locale } = useTmsLocale();
  if (!state.enabled) return null;
  const ru = locale === "ru";
  return <button type="button" className={css.start}
    disabled={Boolean(state.disabledReason) || state.pendingStart || state.pending}
    title={state.disabledReason || (ru ? "Открыть прогон по всем связанным кейсам на проверку" : "Open a run with all linked cases waiting for QA")}
    aria-busy={state.pendingStart || undefined} onClick={() => { void state.start(); }}>
    {state.pendingStart ? <Loader2 size={14} className={css.spinner} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
    <span>{ru ? "Проверить исправления" : "Verify fixes"}</span>
  </button>;
}
