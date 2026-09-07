import { ArrowUpRight, CircleDashed, FileClock, Hash, LoaderCircle } from "lucide-react";
import type { DashboardWorkbenchModel } from "../../../dashboards/workbench/application/useDashboardWorkbench";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { WorkbenchStatus } from "./controls/WorkbenchStatus";
import styles from "./workbench.module.css";

export function FreshnessPanel({ model }: { model: DashboardWorkbenchModel }) {
  const { t } = useTmsLocale();
  const freshness = model.snapshot?.freshness;
  const checks = [
    { kind: "notRunItems", count: freshness?.notRunActiveItems, hint: "notRunHint", icon: CircleDashed },
    { kind: "inProgressItems", count: freshness?.inProgressActiveItems, hint: "inProgressHint", icon: LoaderCircle },
    { kind: "outdatedItems", count: freshness?.outdatedActiveItems, hint: "outdatedHint", icon: FileClock },
    { kind: "runsWithoutBuild", count: freshness?.activeRunsWithoutBuild, hint: "noBuildHint", icon: Hash },
  ] as const;
  return <section className={styles.panel} aria-busy={model.loading}>
    <header className={styles.heading}><div><h2>{t("dashboardWorkbench.freshness")}</h2>
      <p>{t("dashboardWorkbench.freshnessHint")}</p></div></header>
    {!freshness && <WorkbenchStatus loading={model.loading} error={model.error} hasSnapshot={false}
      enabled={model.enabled} onRetry={model.refresh} />}
    <ul className={styles.freshness}>
      {checks.map((check) => <li key={check.kind}>
        <button type="button" disabled={check.count === undefined} onClick={() => model.openDrill(check.kind)}>
          <check.icon size={16} aria-hidden="true" />
          <span><strong>{t(`dashboardWorkbench.${check.kind}`)}</strong><small>{t(`dashboardWorkbench.${check.hint}`)}</small></span>
          <b>{check.count ?? "—"}</b><ArrowUpRight size={14} aria-hidden="true" />
        </button>
      </li>)}
    </ul>
  </section>;
}
