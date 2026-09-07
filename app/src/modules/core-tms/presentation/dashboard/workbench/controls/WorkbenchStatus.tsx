import type { WorkbenchFailure } from "../../../../dashboards/workbench/model/workbench";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import styles from "../workbench.module.css";

type Props = { loading: boolean; error: WorkbenchFailure | null; hasSnapshot: boolean;
  enabled?: boolean; onRetry: () => void };

export function WorkbenchStatus({ loading, error, hasSnapshot, enabled = true, onRetry }: Props) {
  const { t } = useTmsLocale();
  if (!enabled) return <p className={styles.state} role="status">{t("dashboardWorkbench.disabled")}</p>;
  if (error) return <div className={styles.state} role="alert">
    <span>{t(`dashboardWorkbench.error.${error.kind}`)} {hasSnapshot && t("dashboardWorkbench.stale")}</span>
    {error.requestId && <small>{t("dashboardWorkbench.requestId", { id: error.requestId })}</small>}
    <button type="button" onClick={onRetry}>{t("dashboardWorkbench.retry")}</button>
  </div>;
  if (loading) return <p className={styles.state} role="status">
    {t(hasSnapshot ? "dashboardWorkbench.refreshing" : "dashboardWorkbench.loading")}
  </p>;
  return null;
}
