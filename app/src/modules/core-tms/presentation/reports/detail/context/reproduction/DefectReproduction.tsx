import { Button } from "@heroui/react";
import { ChevronDown, CircleX, Repeat2 } from "lucide-react";
import { useId, useState } from "react";
import type { Defect } from "../../../../../../../core/tms/contracts/legacy-contract";
import { ScenarioMarkdown } from "../../../../cases/inspector/steps/markdown/ScenarioMarkdown";
import css from "./reproduction.module.css";

export function DefectReproduction({ reproduction, ru }: { reproduction: Defect["reproduction"]; ru: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  if (!reproduction) return null;
  const manual = reproduction.origin === "shared_steps";
  const title = ru ? "Шаги воспроизведения" : "Steps to reproduce";
  const hasFailure = reproduction.steps.some(step => step.failed);
  const explanation = manual
    ? (ru ? "Инструкции воспроизведения из выбранных версий общих сценариев." : "Reproduction instructions from selected shared scenario revisions.")
    : hasFailure ? (ru ? "Исходный снимок прогона до проваленного шага." : "Original run snapshot through the failed step.")
    : (ru ? "Последовательность исходного прогона. Проваленный шаг не указан." : "Original run sequence. No failed step was specified.");
  return <section className={css.section} data-defect-reproduction={reproduction.origin}>
    <Button type="button" variant="light" className={css.disclosure} aria-expanded={expanded} aria-controls={id}
      onPress={() => setExpanded(current => !current)}>
      <ChevronDown size={15} aria-hidden="true" className={css.chevron} data-open={expanded} />
      <span>{title}</span><small>{reproduction.steps.length}</small>
    </Button>
    {expanded && <div id={id} className={css.body}>
      <p className={css.explanation}>{explanation}</p>
      <ol className={css.steps}>{reproduction.steps.map((step, index) => {
        const previous = reproduction.steps[index - 1]?.sharedStep;
        const showShared = step.sharedStep && (previous?.id !== step.sharedStep.id || previous?.revision !== step.sharedStep.revision);
        return <li key={`${index}:${step.id}`} className={css.step} data-failed={step.failed || undefined}>
          {showShared && <div className={css.shared}><Repeat2 size={14} aria-hidden="true" /><strong>{step.sharedStep!.title}</strong>
            {step.sharedStep!.revision !== null && <small>{ru ? "Версия" : "Revision"} {step.sharedStep!.revision}</small>}</div>}
          <div className={css.instruction}><span className={css.order}>{index + 1}.</span>
            <div className={css.action}><ScenarioMarkdown value={step.action} label={ru ? "Действие" : "Action"} /></div>
            {step.failed && <span className={css.failed}><CircleX size={15} aria-hidden="true" /><span>{ru ? "Провален" : "Failed"}</span></span>}
          </div>
          {step.expectedResult && <div className={css.metadata}><span>{ru ? "Ожидается" : "Expected"}</span>
            <ScenarioMarkdown value={step.expectedResult} label={ru ? "Ожидаемый результат" : "Expected result"} /></div>}
          {step.testData && <div className={css.metadata}><span>{ru ? "Тестовые данные" : "Test data"}</span>
            <ScenarioMarkdown value={step.testData} label={ru ? "Тестовые данные" : "Test data"} /></div>}
        </li>;
      })}</ol>
      {!reproduction.steps.length && <p className={css.explanation}>{ru ? "Инструкции не сохранены." : "No instructions were captured."}</p>}
    </div>}
  </section>;
}
