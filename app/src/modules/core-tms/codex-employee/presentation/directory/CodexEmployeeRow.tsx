import React from "react";
import type { CodexEmployee } from "../../domain/model/codex-employee";
import { CodexMark } from "../branding/CodexMark";
import { codexCopy } from "../copy/codex-copy";
import styles from "./codex-employee-row.module.css";
export function CodexEmployeeRow({ employee, locale }: {
    employee: CodexEmployee;
    locale: "en" | "ru";
}) {
    const copy = codexCopy(locale);
    return <div className={styles.row} data-codex-employee-row>
    <CodexMark className={styles.avatar}/><span><strong>Codex</strong><small>{copy[employee.status]} · {employee.status === "active" ? copy.seat : (locale === "ru" ? "Место не занято" : "No seat occupied")}</small></span>
  </div>;
}
