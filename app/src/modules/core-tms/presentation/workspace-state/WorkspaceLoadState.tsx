import { AlertTriangle, FlaskConical, RefreshCw } from "lucide-react";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
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
  const { t } = useTmsLocale();
  if (!failure) {
    return (
      <section className={styles.onboarding} aria-busy="true">
        <div className={styles.onboardingPanel}>
          <span className={styles.onboardingEyebrow}>{t("workspace.title")}</span>
          <h1>{t("workspace.loading")}</h1>
          <p>{t("workspace.loadingDescription")}</p>
        </div>
      </section>
    );
  }

  const status = failure.detail.match(/status\s+(\d+)/i)?.[1];
  const failureDetail = status
    ? t("api.statusError", { status })
    : t("api.unreachable");

  return (
    <section className={styles.onboarding} data-testid="workspace-load-error">
      <div className={styles.onboardingPanel} role="alert">
        <span className={styles.onboardingEyebrow}>
          {t("workspace.connectionRequired")}
        </span>
        <h1>{t("workspace.unavailable")}</h1>
        <p>
          {failureDetail} {t("workspace.noLocalReplacement")}
          {failure.requestId && <> <code>{failure.requestId}</code></>}
        </p>
        <div className={styles.inlineActions}>
          <button className={styles.primaryButton} onClick={onRetry}>
            <RefreshCw size={16} /> {t("common.retry")}
          </button>
          {demoAvailable && (
            <button className={styles.secondaryButton} onClick={onUseDemo}>
              <FlaskConical size={16} /> {t("workspace.openDemo")}
            </button>
          )}
        </div>
        <div className={styles.blockerNotice}>
          <AlertTriangle size={21} />
          <span>
            <strong>{t("workspace.productionProtected")}</strong>
            <small>{t("workspace.editingDisabled")}</small>
          </span>
        </div>
      </div>
    </section>
  );
}
