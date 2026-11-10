import { ErrorToast } from "../../../common/error/ErrorToast";
import { ContentSkeleton } from "../../../common/skeleton/ContentSkeleton";
import type { WorkbenchFailure } from "../../../../dashboards/workbench/model/workbench";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import styles from "../workbench.module.css";

type Props = { loading: boolean; error: WorkbenchFailure | null; hasSnapshot: boolean;
  enabled?: boolean; onRetry: () => void };

export function WorkbenchStatus({ loading, error, hasSnapshot, enabled = true, onRetry }: Props) {
  const { t } = useTmsLocale();
  if (!enabled) return <p className={styles.state} role="status">{t("dashboardWorkbench.disabled")}</p>;
  if (error) return <ErrorToast
    message={[t(`dashboardWorkbench.error.${error.kind}`), hasSnapshot ? t("dashboardWorkbench.stale") : "",
      error.requestId ? t("dashboardWorkbench.requestId", { id: error.requestId }) : ""].filter(Boolean).join(" ")}
    retryLabel={t("dashboardWorkbench.retry")} onRetry={onRetry} />;
  if (loading && !hasSnapshot) return <ContentSkeleton variant="dashboard" label={t("dashboardWorkbench.loading")} />;
  if (loading) return <p className={styles.state} role="status">
    {t(hasSnapshot ? "dashboardWorkbench.refreshing" : "dashboardWorkbench.loading")}
  </p>;
  return null;
}
