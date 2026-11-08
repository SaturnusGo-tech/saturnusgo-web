"use client";

import { Button } from "@heroui/react";
import type { ReactNode } from "react";
import { ProductDocTooltip } from "../../../../overlay/ProductDocTooltip";
import styles from "../product-doc-structured.module.css";

export function StructuredAction({ label, onPress, disabled, pressed, children }: {
  label: string; onPress(): void; disabled?: boolean; pressed?: boolean; children: ReactNode;
}) {
  return <ProductDocTooltip label={label}><Button type="button" variant="light" size="sm" disableRipple isIconOnly
    className={styles.action} aria-label={label} isDisabled={disabled} aria-pressed={pressed} onPress={onPress}>
    {children}
  </Button></ProductDocTooltip>;
}
