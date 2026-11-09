"use client";

import { Button } from "@heroui/react";
import type { ReactNode } from "react";
import { ProductDocTooltip } from "../../../../overlay/ProductDocTooltip";
import styles from "../product-doc-structured.module.css";

export function StructuredAction({ label, onPress, disabled, inactive, pressed, children }: {
  label: string; onPress(): void; disabled?: boolean; inactive?: boolean; pressed?: boolean; children: ReactNode;
}) {
  return <ProductDocTooltip label={label} isDisabled={inactive}><Button type="button" variant="light" size="sm" disableRipple isIconOnly
    className={styles.action} aria-label={label} isDisabled={disabled} aria-disabled={inactive || undefined} tabIndex={inactive ? -1 : undefined}
    aria-pressed={pressed} onPress={inactive ? undefined : onPress}>
    {children}
  </Button></ProductDocTooltip>;
}
