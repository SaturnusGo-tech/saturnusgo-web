import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "../documentation.module.css";

export function CopyButton({ value, label }: { value: string | (() => string); label: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  async function copy() {
    try { await navigator.clipboard.writeText(typeof value === "function" ? value() : value); setState("copied"); }
    catch { setState("failed"); }
    clearTimeout(timer.current); timer.current = setTimeout(() => setState("idle"), 3000);
  }
  return <span className={styles.copyControl}>
    <button type="button" className={styles.quietButton} onClick={() => void copy()} aria-label={label}>
      {state === "copied" ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
      <span>{state === "copied" ? "Скопировано" : label}</span>
    </button>
    <span className={state === "failed" ? styles.copyError : styles.srOnly} role="status">
      {state === "copied" ? "Скопировано" : state === "failed" ? "Не удалось скопировать. Выделите текст или скопируйте адрес из браузера." : ""}
    </span>
  </span>;
}
