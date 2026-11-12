import { IntegrationButton } from "../../../presentation/common/integration-controls/button/IntegrationButton";
import { IntegrationTextarea } from "../../../presentation/common/integration-controls/textarea/IntegrationTextarea";
import { useId } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import type { ImpactAnalysis } from "../../model/impact-types";
import { buildCaseDeepLink } from "../../../test-cases/navigation/case-deep-link";
import type { CoverageGapProps } from "./CoverageGaps";
import css from "./gaps.module.css";

type Gap = NonNullable<ImpactAnalysis["result"]>["coverageGaps"][number];
type Props = CoverageGapProps & {
  gap: Gap; expanded: boolean; onToggle: () => void; acknowledging: boolean;
  onAcknowledge: () => void; reason: string; onReason: (value: string) => void;
};
const platformNames: Record<Gap["platform"], string> = { web: "Web", backend: "Backend", ios: "iOS", android: "Android", api: "API", shared: "Shared" };

export function GapRow({ gap, analysis, ru, writable, pending, command, expanded, onToggle, acknowledging, onAcknowledge, reason, onReason }: Props) {
  const panelId = useId(); const triggerId = `${panelId}-trigger`; const reasonId = `${panelId}-reason`;
  const action = analysis.gapActions.find(entry => entry.gapId === gap.id);
  const actionable = writable && action?.status !== "generating" && action?.status !== "generated" && action?.status !== "acknowledged";
  const href = action?.testCaseId && typeof window !== "undefined" ? buildCaseDeepLink(window.location.href,
    { workspaceId: analysis.workspaceId, projectId: analysis.projectId, caseId: action.testCaseId }) : null;
  const status = action?.status === "generated" ? (ru ? "Черновик готов" : "Draft ready")
    : action?.status === "acknowledged" ? (ru ? "Принят QA" : "Acknowledged")
      : action?.status === "generating" ? (ru ? "Готовим черновик…" : "Preparing draft…")
        : action?.status === "failed" ? (ru ? "Ошибка черновика" : "Draft failed")
          : (ru ? "Нужна проверка" : "Needs review");
  return <li className={css.row} data-open={expanded || undefined}>
    <IntegrationButton type="button" className={css.toggle} id={triggerId} aria-expanded={expanded} aria-controls={panelId}
      aria-label={`${expanded ? (ru ? "Свернуть пробел покрытия" : "Collapse coverage gap") : (ru ? "Раскрыть пробел покрытия" : "Expand coverage gap")}: ${gap.area}`} onPress={onToggle}>
      <span className={css.identity}><strong>{gap.area}</strong><span className={css.counts}>
        {gap.changedFiles.length} {ru ? "файлов" : "files"}<span aria-hidden="true">·</span>{gap.suggestedTestCases.length} {ru ? "проверок" : "checks"}
      </span></span>
      <span className={css.meta}><span>{platformNames[gap.platform]}</span><span className={css.status} data-status={action?.status}>{status}</span></span>
      <ChevronDown size={15} strokeWidth={1.6} className={css.chevron} aria-hidden="true" />
    </IntegrationButton>
    <div className={css.reveal} id={panelId} role="region" aria-labelledby={triggerId} aria-hidden={!expanded}
      ref={element => { if (element) element.inert = !expanded; }}>
      <div className={css.clip}><div className={css.content}>
        <p className={css.reason}>{gap.reason}</p>
        <div className={css.evidence}>
          <div><h4>{ru ? "Изменённые файлы" : "Changed files"}</h4>
            {gap.changedFiles.length ? <ul className={css.files}>{gap.changedFiles.map((file, i) => <li key={`${file}-${i}`}><code>{file}</code></li>)}</ul>
              : <p className={css.muted}>{ru ? "Файлы не указаны." : "No files specified."}</p>}</div>
          <div><h4>{ru ? "Предлагаемые проверки" : "Suggested checks"}</h4>
            {gap.suggestedTestCases.length ? <ul className={css.checks}>{gap.suggestedTestCases.map((text, i) => <li key={i}>{text}</li>)}</ul>
              : <p className={css.muted}>{ru ? "Проверки не указаны." : "No checks specified."}</p>}</div>
        </div>
        {action?.status === "generating" && <p role="status" className={css.feedback}>{ru ? "Готовим черновик…" : "Preparing draft…"}</p>}
        {action?.status === "failed" && <p role={expanded ? "alert" : undefined} className={css.error}>
          {ru ? "Не удалось создать черновик. Можно повторить или заполнить вручную." : "Draft creation failed. Retry or prepare it manually."}{action.errorCode && <span>{action.errorCode}</span>}</p>}
        {action?.status === "acknowledged" && <p className={css.feedback}><strong>{ru ? "Пробел принят QA:" : "Acknowledged by QA:"}</strong> {action.reason}</p>}
        {href && <a className={css.draftLink} href={href}>{ru ? "Открыть черновик теста" : "Open test draft"}<ExternalLink size={13} aria-hidden="true" /></a>}
        {actionable && <div className={css.actions}>
          {analysis.aiEnabled !== false && <IntegrationButton type="button" isDisabled={pending} onPress={() => void command({ action: `gaps/${gap.id}/generate`, body: { mode: "ai" } })}>
            {action?.status === "failed" ? (ru ? "Повторить AI-черновик" : "Retry AI draft") : (ru ? "Подготовить AI-черновик" : "Generate AI draft")}</IntegrationButton>}
          <IntegrationButton type="button" isDisabled={pending} onPress={() => void command({ action: `gaps/${gap.id}/generate`, body: { mode: "manual" } })}>{ru ? "Заполнить вручную" : "Create manual draft"}</IntegrationButton>
          <IntegrationButton type="button" isDisabled={pending} aria-expanded={acknowledging} aria-controls={reasonId} onPress={onAcknowledge}>{ru ? "Принять пробел" : "Acknowledge gap"}</IntegrationButton>
        </div>}
        {acknowledging && actionable && <form className={css.form} id={reasonId} onSubmit={event => {
          event.preventDefault(); if (!pending && reason.trim()) void command({ action: `gaps/${gap.id}/acknowledge`, body: { reason: reason.trim() } });
        }}><IntegrationTextarea label={ru ? "Почему отдельная проверка не требуется сейчас" : "Why a separate test is not required now"}
            isRequired maxLength={2000} isDisabled={pending} value={reason} onValueChange={onReason} />
          <IntegrationButton type="submit" isDisabled={pending || !reason.trim()}>{ru ? "Сохранить решение" : "Save decision"}</IntegrationButton></form>}
      </div></div>
    </div>
  </li>;
}
