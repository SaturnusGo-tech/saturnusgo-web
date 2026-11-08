"use client";

import { Tooltip } from "@heroui/react";
import type { ReactElement } from "react";
import styles from "./falcon-tooltip.module.css";

export function FalconTooltip({ label, children, placement = "top", offset = 7, isDisabled, className }: {
  label: string;
  children: ReactElement;
  placement?: "top" | "right";
  offset?: number;
  isDisabled?: boolean;
  className?: string;
}) {
  // Keep the CSS entrance fade. HeroUI's retained exit can flash before it unmounts.
  return <Tooltip content={label} placement={placement} delay={450} closeDelay={60} offset={offset}
    disableAnimation isDisabled={isDisabled}
    classNames={{ base: className ? `${styles.tooltip} ${className}` : styles.tooltip, content: styles.tooltipContent }}>
    {children}
  </Tooltip>;
}
