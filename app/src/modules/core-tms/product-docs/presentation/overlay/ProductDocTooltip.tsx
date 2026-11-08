"use client";

import { Tooltip } from "@heroui/react";
import type { ReactElement } from "react";
import styles from "./product-doc-overlay.module.css";

export function ProductDocTooltip({ label, children }: { label: string; children: ReactElement }) {
  return <Tooltip content={label} delay={450} closeDelay={60} offset={7}
    classNames={{ base: styles.tooltip, content: styles.tooltipContent }}>{children}</Tooltip>;
}
