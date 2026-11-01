import React, { type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import type { CodexEmployee } from "../../domain/model/codex-employee";
import { CodexMark } from "../branding/CodexMark";
import { codexCopy } from "../copy/codex-copy";
import styles from "./codex-employee-row.module.css";
export function CodexEmployeeRow({ employee, locale, management }: {
    employee: CodexEmployee;
    management?: ReactNode;
    locale: "en" | "ru";
}) {
    const copy = codexCopy(locale);
    const identity = <div className={styles.row} data-codex-employee-row>
    <CodexMark className={styles.avatar}/><span><strong>Codex</strong><small>{copy[employee.status]} · {employee.status === "active" ? copy.seat : (locale === "ru" ? "Место не занято" : "No seat occupied")}</small></span>
  </div>;
    return management ? <details className={styles.entry} data-codex-employee-entry>
      <summary className={styles.summary} aria-label={copy.management}>{identity}<ChevronDown size={16} aria-hidden="true" /></summary>
      <div className={styles.management}>{management}</div>
    </details> : identity;
}
