import React from "react";
import { ChevronRight } from "lucide-react";
import type { CodexEmployee } from "../../domain/model/codex-employee";
import { CodexMark } from "../branding/CodexMark";
import { codexCopy } from "../copy/codex-copy";
import { CodexResourceState } from "../shared/CodexResourceState";
import styles from "./codex-employee-row.module.css";

export function CodexEmployeeRow({ employee, locale, href, loading = false, error = null, retry = () => {} }: {
  employee: CodexEmployee | null; locale: "en" | "ru"; href?: string;
  loading?: boolean; error?: string | null; retry?: () => void;
}) {
  const copy = codexCopy(locale);
  if (!employee) return <CodexResourceState loading={loading} error={error} locale={locale} retry={retry} />;
  const identity = <div className={styles.row} data-codex-employee-row>
    <CodexMark className={styles.avatar} /><span><strong>Codex</strong><small>{copy[employee.status]} · {employee.status === "active" ? copy.seat : (locale === "ru" ? "Место не занято" : "No seat occupied")}</small></span>
    {href && <ChevronRight size={16} aria-hidden="true" />}
  </div>;
  return href ? <a className={styles.entry} href={href} data-codex-employee-entry aria-label={copy.management}>{identity}</a> : identity;
}
