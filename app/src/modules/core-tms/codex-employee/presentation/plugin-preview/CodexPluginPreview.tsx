import { ArrowRight } from "@openai/apps-sdk-ui/components/Icon";
import { useState } from "react";
import { CodexMark } from "../branding/CodexMark";
import css from "./preview.module.css";

export function CodexPluginPreview({ ru }: { ru: boolean }) {
  const [copied, setCopied] = useState<"done" | "error" | null>(null);
  const prompts = ru ? [
    "Изучи этот сайт и подготовь тест-кейсы для регистрации. Разложи их по папкам Falcon.",
    "Подготовь прогон для следующего релиза из смоук-кейсов. Покажи состав перед запуском.",
    "Разбери результаты последнего прогона: что не прошло, какие дефекты открыты и что проверить дальше.",
  ] : [
    "Review this website and draft registration test cases. Organize the coverage into Falcon folders.",
    "Prepare a smoke run for the next release. Show me the scope before starting the tests.",
    "Review the latest run: what failed, which defects are open, and what should we check next?",
  ];
  const copy = async (prompt: string) => {
    try { await navigator.clipboard.writeText(prompt); setCopied("done"); }
    catch { setCopied("error"); }
  };
  return <div className={css.preview}>
    <div className={css.prompts}>{prompts.map(prompt => <button key={prompt} type="button" title={ru ? "Скопировать пример задачи" : "Copy example task"}
      aria-label={`${ru ? "Скопировать пример" : "Copy example"}: ${prompt}`} onClick={() => void copy(prompt)}>
      <span><CodexMark /><strong>Codex</strong> {prompt}</span><ArrowRight width={18} height={18} aria-hidden="true" />
    </button>)}</div>
    <span className={css.feedback} role="status">{copied === "done" ? (ru ? "Скопировано. Вставьте задачу в Codex." : "Copied. Paste the task into Codex.") : copied === "error" ? (ru ? "Не удалось скопировать. Выделите текст примера." : "Could not copy. Select the example text.") : ""}</span>
  </div>;
}
