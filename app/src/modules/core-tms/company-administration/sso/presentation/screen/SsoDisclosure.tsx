import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./sso.module.css";

export function SsoDisclosure({ title, description, children }: {
  readonly title: string; readonly description: string; readonly children: ReactNode;
}) {
  return <details className={styles.disclosure}>
    <summary className={styles.row}>
      <span className={styles.rowCopy}>
        <span className={styles.rowTitle}>{title}</span>
        <span className={styles.hint}>{description}</span>
      </span>
      <ChevronDown className={styles.chevron} size={16} aria-hidden="true" />
    </summary>
    <div className={styles.detailsBody}>{children}</div>
  </details>;
}
