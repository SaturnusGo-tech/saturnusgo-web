import { transitionContent } from "../../../workspace/motion/transition/content-transition";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import styles from "../run-navigator.module.css";

export function RunListTabs({ mode, activeCount, archivedCount, onChange }: {
  mode: "active" | "archived";
  activeCount: number;
  archivedCount: number;
  onChange: (mode: "active" | "archived") => void;
}) {
  const { t } = useTmsLocale();
  return <div className={styles.viewSwitch} role="tablist" aria-label={t("runs.listMode")}>
    {(["active", "archived"] as const).map((value) => <button
      className={mode === value ? styles.viewActive : styles.viewTab}
      key={value} type="button" role="tab" aria-selected={mode === value}
      onClick={() => transitionContent(() => onChange(value))}>
      {value === "active" ? t("runs.activeList") : t("runs.archiveHistory")}
      <span>{value === "active" ? activeCount : archivedCount}</span>
    </button>)}
  </div>;
}
