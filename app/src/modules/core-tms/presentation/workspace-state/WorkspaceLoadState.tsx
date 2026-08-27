import { AlertTriangle, FlaskConical, RefreshCw } from "lucide-react";
import type { WorkspaceFailure } from "../../state/workspace/useWorkspaceBootstrap";
import styles from "../../tms.module.css";

export function WorkspaceLoadState({
  failure,
  demoAvailable,
  onRetry,
  onUseDemo,
}: {
  failure: WorkspaceFailure | null;
  demoAvailable: boolean;
  onRetry: () => void;
  onUseDemo: () => void;
}) {
  if (!failure) {
    return (
      <section className={styles.onboarding} aria-busy="true">
        <div className={styles.onboardingPanel}>
          <span className={styles.onboardingEyebrow}>TMS workspace</span>
          <h1>Loading workspace…</h1>
          <p>Connecting to the TMS API and loading the latest project state.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.onboarding} data-testid="workspace-load-error">
      <div className={styles.onboardingPanel} role="alert">
        <span className={styles.onboardingEyebrow}>Connection required</span>
        <h1>Workspace unavailable</h1>
        <p>
          {failure.detail} No workspace data was replaced or saved locally.
          {failure.requestId ? ` Request ID: ${failure.requestId}.` : ""}
        </p>
        <div className={styles.inlineActions}>
          <button className={styles.primaryButton} onClick={onRetry}>
            <RefreshCw size={16} /> Retry
          </button>
          {demoAvailable && (
            <button className={styles.secondaryButton} onClick={onUseDemo}>
              <FlaskConical size={16} /> Open development demo
            </button>
          )}
        </div>
        <div className={styles.blockerNotice}>
          <AlertTriangle size={21} />
          <span>
            <strong>Production data remains protected</strong>
            <small>Editing is disabled until the API connection is restored.</small>
          </span>
        </div>
      </div>
    </section>
  );
}
