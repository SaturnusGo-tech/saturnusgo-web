import { useState } from "react";
import type { ImpactAnalysis, ImpactCommand } from "../../model/impact-types";
import { buildCaseDeepLink } from "../../../test-cases/navigation/case-deep-link";
import { ReviewCollection } from "../review/ReviewCollection";
import css from "../styles/impact.module.css";
export function CoverageGaps({ analysis, ru, writable, pending, command }: {
  analysis: ImpactAnalysis; ru: boolean; writable: boolean; pending: boolean; command: (value: ImpactCommand) => Promise<void>;
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  return <section className={css.panel}><header className={css.heading}><div><h3>{ru ? "Пробелы покрытия" : "Coverage gaps"}</h3>
    <p>{ru ? "Черновики требуют проверки QA и не включаются в прогон автоматически." : "Drafts require QA review and are not added to the run automatically."}</p></div></header>
    {!analysis.result?.coverageGaps.length && <p className={css.muted}>{analysis.result ? (ru ? "Анализ не сообщил о пробелах покрытия." : "The analysis reported no coverage gaps.") : (ru ? "Результат анализа ещё не получен." : "Analysis results are not available yet.")}</p>}
    <ReviewCollection items={analysis.result?.coverageGaps ?? []} ru={ru} label={ru ? "Пробелы покрытия" : "Coverage gaps"}
      text={(gap) => [gap.area, gap.reason, gap.platform, ...gap.changedFiles].join(" ")}>{(gap) => <Gap key={gap.id} gap={gap} analysis={analysis} ru={ru}
      writable={writable} pending={pending} command={command} acknowledging={editing === gap.id} onToggle={() => setEditing(editing === gap.id ? null : gap.id)}
      reason={drafts[gap.id] ?? ""} onReason={(value) => setDrafts((current) => ({ ...current, [gap.id]: value }))} />}</ReviewCollection>
  </section>;
}
function Gap({ gap, analysis, ru, writable, pending, command, acknowledging, onToggle, reason, onReason }: {
  gap: NonNullable<ImpactAnalysis["result"]>["coverageGaps"][number]; analysis: ImpactAnalysis;
  ru: boolean; writable: boolean; pending: boolean; command: (value: ImpactCommand) => Promise<void>;
  acknowledging: boolean; onToggle: () => void; reason: string; onReason: (value: string) => void;
}) {
  const action = analysis.gapActions.find((entry) => entry.gapId === gap.id);
  const mutable = writable && !pending && action?.status !== "generating" && action?.status !== "generated" && action?.status !== "acknowledged";
  const href = action?.testCaseId && typeof window !== "undefined" ? buildCaseDeepLink(window.location.href,
    { workspaceId: analysis.workspaceId, projectId: analysis.projectId, caseId: action.testCaseId }) : null;
  return <li className={css.row}>
    <div className={css.rowHeading}><strong>{gap.area}</strong><span className={css.badge}>{gap.platform}</span></div>
    <p className={css.muted}>{gap.reason}</p>
    <details><summary>{ru ? "Изменения и предлагаемые проверки" : "Changes and suggested checks"}</summary>
      <ul className={css.files}>{[...gap.changedFiles, ...gap.suggestedTestCases].map((text, index) => <li key={index}>{text}</li>)}</ul></details>
    {action?.status === "generating" && <p role="status" className={css.notice}>{ru ? "Готовим черновик…" : "Preparing draft…"}</p>}
    {action?.status === "failed" && <p role="alert" className={css.error}>{ru ? "Не удалось создать черновик. Можно повторить или заполнить вручную." : "Draft creation failed. Retry or prepare it manually."} {action.errorCode}</p>}
    {action?.status === "acknowledged" && <p className={css.notice}>{ru ? "Пробел принят QA:" : "Acknowledged by QA:"} {action.reason}</p>}
    {href && <a className={css.button} href={href}>{ru ? "Открыть черновик теста" : "Open test draft"}</a>}
    {mutable && <div className={css.actions}>
      {analysis.aiEnabled !== false && <button type="button" onClick={() => void command({ action: `gaps/${gap.id}/generate`, body: { mode: "ai" } })}>{action?.status === "failed" ? (ru ? "Повторить AI-черновик" : "Retry AI draft") : (ru ? "Подготовить AI-черновик" : "Generate AI draft")}</button>}
      <button type="button" onClick={() => void command({ action: `gaps/${gap.id}/generate`, body: { mode: "manual" } })}>{ru ? "Заполнить вручную" : "Create manual draft"}</button>
      <button type="button" aria-expanded={acknowledging} onClick={onToggle}>{ru ? "Принять пробел" : "Acknowledge gap"}</button></div>}
    {acknowledging && mutable && <form onSubmit={(event) => { event.preventDefault(); if (reason.trim()) void command({ action: `gaps/${gap.id}/acknowledge`, body: { reason: reason.trim() } }); }}>
      <label className={css.field}>{ru ? "Почему отдельная проверка не требуется сейчас" : "Why a separate test is not required now"}
        <textarea required maxLength={2000} value={reason} onChange={(event) => onReason(event.target.value)} /></label>
      <button type="submit" disabled={!reason.trim()}>{ru ? "Сохранить решение" : "Save decision"}</button></form>}
  </li>;
}
