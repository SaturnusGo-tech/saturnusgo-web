import { useId } from "react";
import { ScenarioMarkdownInput } from "../../../cases/inspector/steps/markdown/ScenarioMarkdownInput";
import inspector from "../../../cases/inspector/caseInspector.module.css";
import steps from "../../../cases/inspector/steps/scenarioSteps.module.css";
import css from "./results.module.css";

type Props = {
  ru: boolean; actual: string; expected: string; error?: string;
  onActualChange: (value: string) => void;
  onExpectedChange: (value: string) => void;
};

export function DefectResults({ ru, actual, expected, error, onActualChange, onExpectedChange }: Props) {
  const id = useId();
  const actualLabel = ru ? "Фактический результат" : "Actual result";
  const expectedLabel = ru ? "Ожидаемый результат" : "Expected result";
  return <section className={`${inspector.section} ${inspector.creationSection}`} aria-label={actualLabel}>
    <header><h3>{actualLabel}</h3></header>
    <div className={`${steps.stepGroup} ${css.results}`} data-defect-results>
      <div className={steps.actionLines} data-input-shell aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined}>
        <ScenarioMarkdownInput id={`${id}-actual`} ru={ru} hideEditButton footerOnlyWhileEditing
          value={actual} label={actualLabel} placeholder={ru ? "Что произошло" : "What happened"}
          onChange={onActualChange} />
      </div>
      {error && <small id={`${id}-error`} className={css.error} role="alert">{error}</small>}
      <div className={`${steps.expectedBlock} ${css.expected}`} data-input-shell>
        <span className={steps.expectedLabel}>{expectedLabel}</span>
        <ScenarioMarkdownInput id={`${id}-expected`} ru={ru} hideEditButton footerOnlyWhileEditing
          value={expected} label={expectedLabel} placeholder={ru ? "Что должно произойти" : "What should happen"}
          onChange={onExpectedChange} />
      </div>
    </div>
  </section>;
}
