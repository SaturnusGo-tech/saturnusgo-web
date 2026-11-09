import { Button } from "@heroui/react";
import { RotateCcw } from "lucide-react";
import type { DefectRetest } from "../../../../runs/verification/state/defect/useDefectRetest";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { FalconTooltip } from "../../../common/tooltip/FalconTooltip";
import styles from "./defect-retest.module.css";

export function DefectRetestAction({ retest }: { retest: DefectRetest }) {
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  if (!retest.enabled) return null;
  const label = ru ? "Повторная проверка" : "Retest";
  const tooltip = retest.canStart ? label : ru ? "Недостаточно прав для запуска проверки" : "You cannot start a retest";
  const disabled = !retest.canStart || retest.pending;

  return <FalconTooltip label={tooltip}>
    <Button id="defect-retest-toggle" type="button" isIconOnly size="sm" radius="full" disableRipple
      className={`${styles.start} ${styles.retestAction}`} aria-disabled={disabled || undefined}
      aria-label={label} aria-expanded={retest.isOpen} aria-controls="defect-retest-form"
      onPress={disabled ? undefined : retest.isOpen ? retest.close : retest.open}>
      <RotateCcw size={16} aria-hidden="true" />
    </Button>
  </FalconTooltip>;
}
