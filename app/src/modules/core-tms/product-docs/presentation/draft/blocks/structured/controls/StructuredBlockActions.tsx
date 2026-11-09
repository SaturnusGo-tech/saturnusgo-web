"use client";

import type { ReactNode } from "react";
import { LoadingOrb } from "../../../../../../../../shared/components/loading/LoadingOrb";
import { structuredBlockExitMs, type useStructuredBlockActivity } from "../motion/useStructuredBlockActivity";
import styles from "../product-doc-structured.module.css";

export function StructuredBlockActions({ phase, label, children }: {
  phase: ReturnType<typeof useStructuredBlockActivity>["phase"];
  label: string;
  children?: ReactNode;
}) {
  return <div className={styles.controls} data-solving={phase}>
    <div className={styles.actions}>{children}</div>
    {phase && <span className={styles.solving} role="status" aria-label={label}
      style={{ transitionDuration: `${structuredBlockExitMs}ms` }}><LoadingOrb /></span>}
  </div>;
}
