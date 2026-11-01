import React from "react";
import styles from "./codex-mark.module.css";
export function CodexMark({ className }: {
    className?: string;
}) {
    return <span className={`${styles.mark} ${className ?? ""}`} aria-hidden="true">
    <img className={styles.light} src="/assets/integrations/codex/codex-light.png" alt="" width={32} height={32}/>
    <img className={styles.dark} src="/assets/integrations/codex/codex-dark.png" alt="" width={32} height={32}/>
  </span>;
}
