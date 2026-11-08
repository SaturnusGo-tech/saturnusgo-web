import type { ReactElement } from "react";
import { FalconTooltip } from "../../common/tooltip/FalconTooltip";
import styles from "./navigationTooltip.module.css";

export function NavigationTooltip({ enabled, label, children }: {
  enabled?: boolean;
  label: string;
  children: ReactElement;
}) {
  return <FalconTooltip label={label} placement="right" offset={12} isDisabled={!enabled} className={styles.railTooltip}>
    {children}
  </FalconTooltip>;
}
