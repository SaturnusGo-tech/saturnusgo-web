"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { writeClipboardText } from "../../../../../../../shared/lib/clipboard";
import type { TmsLocale } from "../../../../../localization/model/locale";
import styles from "../productDocBlocks.module.css";

export function CopySnippet({ code, locale }: { code: string; locale: TmsLocale }) {
  const ru = locale === "ru";
  const [result, setResult] = useState<{ code: string; copied: boolean }>();
  const copied = result?.code === code ? result.copied : undefined;
  const label = copied ? (ru ? "Код скопирован" : "Code copied") : (ru ? "Копировать код" : "Copy code");
  const feedback = copied === false ? (ru ? "Выделите и скопируйте код вручную" : "Select and copy the code") : copied ? label : "";

  async function copy() {
    try {
      await writeClipboardText(code);
      setResult({ code, copied: true });
    } catch {
      setResult({ code, copied: false });
    }
  }

  return <>
    <button type="button" aria-label={label} title={feedback || label} disabled={!code} onClick={copy}>
      {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
    </button>
    <span className={styles.feedback} role="status">{feedback}</span>
  </>;
}
