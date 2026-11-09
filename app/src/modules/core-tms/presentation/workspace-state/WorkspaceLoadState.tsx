import { RefreshCw, Unplug } from "lucide-react";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import type { WorkspaceFailure } from "../../state/workspace/useWorkspaceBootstrap";
import { TessiqLoader } from "../common/loading/TessiqLoader";
import styles from "./workspace-state.module.css";

export function WorkspaceLoadState({
  failure,
  onRetry,
}: {
  failure: WorkspaceFailure | null;
  onRetry: () => void;
}) {
  const { t } = useTmsLocale();
  if (!failure) {
    return <TessiqLoader pane branded label={t("workspace.loading")} testId="workspace-loading" />;
  }

  return (
    <section className={styles.state} data-testid="workspace-load-error" aria-labelledby="workspace-error-title">
      <div className={styles.content} role="alert">
        <span className={styles.icon} aria-hidden="true"><Unplug size={32} strokeWidth={1.4} /></span>
        <h1 id="workspace-error-title">{t("workspace.unavailable")}</h1>
        <p>{t("workspace.retryDescription")}</p>
        <button type="button" className={styles.retry} onClick={onRetry}>
            <RefreshCw size={16} /> {t("common.retry")}
        </button>
      </div>
    </section>
  );
}
