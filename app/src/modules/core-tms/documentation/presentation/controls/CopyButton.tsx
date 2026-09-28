import { useDocumentationCopy } from "../../localization/useDocumentationCopy";
import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "../documentation.module.css";

export function CopyButton({ value, label }: { value: string | (() => string); label: string }) {
  const copy = useDocumentationCopy();
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  async function copyToClipboard() {
    try { await navigator.clipboard.writeText(typeof value === "function" ? value() : value); setState("copied"); }
    catch { setState("failed"); }
    clearTimeout(timer.current); timer.current = setTimeout(() => setState("idle"), 3000);
  }
  return <span className={styles.copyControl}>
    <button type="button" className={styles.quietButton} onClick={() => void copyToClipboard()} aria-label={label}>
      {state === "copied" ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
      <span>{state === "copied" ? copy.copied : label}</span>
    </button>
    <span className={state === "failed" ? styles.copyError : styles.srOnly} role="status">
      {state === "copied" ? copy.copied : state === "failed" ? copy.copyFailed : ""}
    </span>
  </span>;
}
