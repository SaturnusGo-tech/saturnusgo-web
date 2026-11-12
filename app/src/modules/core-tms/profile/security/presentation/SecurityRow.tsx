import type { ReactNode } from "react";
import styles from "./security-settings.module.css";

export function SecurityRow({ title, description, children }: { title: string; description: ReactNode; children?: ReactNode }) {
  return <div className={styles.row}>
    <div className={styles.copy}><h3>{title}</h3><div className={styles.description}>{description}</div></div>
    {children && <div className={styles.controls}>{children}</div>}
  </div>;
}
