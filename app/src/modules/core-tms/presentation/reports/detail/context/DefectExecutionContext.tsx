import { Circle, CircleX } from "lucide-react";
import type { Defect } from "../../../../../../core/tms/contracts/legacy-contract";
import type { DefectExecutionContext as ExecutionData } from "../../../../defects/execution-context/state/useDefectExecutionContext";
import { resolveDefectExecutionStep } from "../../../../defects/execution-context/model/resolveDefectExecutionStep";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import type { DefectRetest } from "../../../../runs/verification/state/defect/useDefectRetest";
import { buildCaseDeepLink } from "../../../../test-cases/navigation/case-deep-link";
import { DefectReproduction } from "./reproduction/DefectReproduction";
import { DefectRetestMetadata } from "./DefectRetestMetadata";
import css from "./execution-context.module.css";

export function DefectExecutionContext({ defect, context, retest, onOpenRun }: {
  defect: Defect; context: ExecutionData; retest?: DefectRetest;
  onOpenRun: (runId: string, itemId: string | null) => void;
}) {
  const { locale, t } = useTmsLocale(); const ru = locale === "ru";
  const { run, item, pending, error } = context;
  const capturedFailure = defect.reproduction?.steps.find(step => step.failed);
  const step = defect.reproduction ? (capturedFailure ? { order: capturedFailure.order, text: capturedFailure.action } : null)
    : resolveDefectExecutionStep(item, defect.stepId);
  const missing = pending ? (ru ? "Загрузка…" : "Loading…") : (ru ? "Недоступно" : "Unavailable");
  return <section className={css.context} aria-labelledby="defect-execution-heading" aria-busy={pending}>
    <header className={css.heading}>
      <h3 id="defect-execution-heading">{t("reports.executionContext")}</h3>
      {run && <p className={css.environment}><span>{run.environment.name}</span><span aria-hidden="true">·</span><span>{run.build}</span></p>}
    </header>
    {defect.runId ? <div className={css.trace}>
      <div className={css.row}>
        <Circle size={8} className={css.dot} aria-hidden="true" />
        <span className={css.label}>{ru ? "Исходный прогон" : "Original run"}</span>
        <button type="button" className={css.link} data-source-run onClick={() => onOpenRun(defect.runId!, defect.runItemId)}>
          {run ? `${run.key} · ${run.name}` : (ru ? "Открыть исходный прогон" : "Open original run")}
        </button>
      </div>
      <div className={css.row}>
        <Circle size={8} className={css.dot} aria-hidden="true" />
        <span className={css.label}>{t("reports.runItem")}</span>
        {item ? <button type="button" className={css.link} onClick={() => onOpenRun(defect.runId!, item.id)}>{item.snapshot.title}</button> : <span className={css.muted}>{missing}</span>}
      </div>
      {capturedFailure?.sharedStep && <div className={css.row}>
        <Circle size={8} className={css.dot} aria-hidden="true" />
        <span className={css.label}>{ru ? "Общий сценарий" : "Shared scenario"}</span>
        <span className={css.step}>{capturedFailure.sharedStep.title}</span>
      </div>}
      {(defect.stepId || capturedFailure) && <div className={css.row} data-failed-step>
        <CircleX size={15} className={css.failed} aria-hidden="true" />
        <strong className={css.label}>{ru ? "Проваленный шаг" : "Failed step"}</strong>
        <strong className={css.step}>{step ? `${step.order}. ${step.text}` : defect.stepId ? missing : (ru ? "Не указан" : "Not specified")}</strong>
      </div>}
    </div> : defect.sourceCaseId ? <a className={css.link} href={buildCaseDeepLink(
      typeof window === "undefined" ? "https://tms.saturnusgo.com/" : window.location.href,
      { projectId: defect.projectId, caseId: defect.sourceCaseId })}>{ru ? "Открыть тест-кейс" : "Open test case"}</a>
      : <p className={css.muted}>{t("reports.noRunContext")}</p>}
    <DefectReproduction key={defect.id} reproduction={defect.reproduction} ru={ru} />
    {error && <p role="status" className={css.muted}>{ru ? "Часть исходного контекста недоступна." : "Some original execution details are unavailable."}</p>}
    {retest && (retest.latest || retest.contextError) && <DefectRetestMetadata retest={retest} />}
  </section>;
}
