import { Play } from "lucide-react";
import type { DefectRetest } from "../../../../runs/verification/state/defect/useDefectRetest";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import styles from "./defect-retest.module.css";

export function DefectRetestAction({ retest }: { retest: DefectRetest }) {
  const { locale } = useTmsLocale(); const ru = locale === "ru";
  if (!retest.enabled) return null;
  const label = ru ? "Повторная проверка" : "Retest";
  return <button id="defect-retest-toggle" type="button" className={styles.start} onClick={retest.isOpen ? retest.close : retest.open}
    disabled={!retest.canStart || retest.pending} aria-label={label} aria-expanded={retest.isOpen} aria-controls="defect-retest-form"
    title={!retest.canStart ? (ru ? "Недостаточно прав для запуска проверки" : "You cannot start a retest") : label}>
    <Play size={15} fill="currentColor" aria-hidden="true" /><span>{label}</span>
  </button>;
}
