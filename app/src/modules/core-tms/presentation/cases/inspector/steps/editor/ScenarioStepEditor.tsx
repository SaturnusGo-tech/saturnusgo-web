"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import type { TestStep } from "../../../../../../../core/tms/contracts/legacy-contract";
import type { SharedStepSummary } from "../../../../../shared-steps/model/shared-step";
import {
  ScenarioAttachmentControls,
  useScenarioAttachments,
} from "../support/ScenarioAttachments";
import { ScenarioTextInput } from "./ScenarioTextInput";
import { StepActionMenu } from "../menu/StepActionMenu";
import {
  insertScenarioLine,
  joinScenarioAction,
  removeScenarioLine,
  replaceScenarioLine,
  scenarioLineLabel,
  splitScenarioAction,
} from "../support/scenarioLines";
import css from "../scenarioSteps.module.css";

type Props = {
  step: TestStep;
  order: number;
  autoFocus: boolean;
  canRemove: boolean;
  ru: boolean;
  sharedSteps: readonly SharedStepSummary[];
  allowSharedSteps?: boolean;
  onChange: (next: Partial<TestStep>) => void;
  onAddAfter: (withExpectedResult: boolean) => void;
  onInsertShared: (id: string) => void;
  onDuplicate: () => void;
  onRemove: () => void;
};

export function ScenarioStepEditor(props: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const lines = splitScenarioAction(props.step.action);
  const actionAttachments = useScenarioAttachments({
    fieldKey: `step:${props.step.id}:action`,
    stepId: props.step.id,
  });
  const expectedAttachments = useScenarioAttachments({
    fieldKey: `step:${props.step.id}:expected`,
    stepId: props.step.id,
  });
  const dataAttachments = useScenarioAttachments({
    fieldKey: `step:${props.step.id}:data`,
    stepId: props.step.id,
  });

  function focusLine(index: number) {
    requestAnimationFrame(() => {
      document.getElementById(`scenario-${props.step.id}-${index}`)?.focus();
    });
  }

  function updateLine(index: number, value: string) {
    const replacementCount = value.replace(/\r\n?/g, "\n").split("\n").length;
    props.onChange({ action: joinScenarioAction(replaceScenarioLine(lines, index, value)) });
    if (replacementCount > 1) focusLine(index + replacementCount - 1);
  }

  function handleLineKey(event: KeyboardEvent<HTMLTextAreaElement>, index: number) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      props.onChange({ action: joinScenarioAction(insertScenarioLine(lines, index)) });
      focusLine(index + 1);
      return;
    }
    if (event.key === "Backspace" && index > 0 && lines[index] === "") {
      event.preventDefault();
      props.onChange({ action: joinScenarioAction(removeScenarioLine(lines, index)) });
      focusLine(index - 1);
    }
  }

  return <article className={css.stepGroup}>
    <div className={css.stepMenu}><StepActionMenu ru={props.ru}
      sharedSteps={props.sharedSteps} canRemove={props.canRemove}
      allowSharedSteps={props.allowSharedSteps}
      onAdd={props.onAddAfter} onInsertShared={props.onInsertShared}
      onDuplicate={props.onDuplicate} onRemove={props.onRemove} /></div>
    <div className={css.actionLines}>
      {(collapsed ? lines.slice(0, 1) : lines).map((line, lineIndex) => <div
        className={`${css.actionLine} ${lineIndex === 0 ? css.primaryLine : css.nestedLine}`}
        key={`${props.step.id}-${lineIndex}`}>
        {lineIndex === 0 && <button type="button" className={css.collapseButton}
          aria-expanded={!collapsed}
          aria-label={collapsed
            ? (props.ru ? `Развернуть шаг ${props.order}` : `Expand step ${props.order}`)
            : (props.ru ? `Свернуть шаг ${props.order}` : `Collapse step ${props.order}`)}
          onClick={() => setCollapsed((value) => !value)}>
          {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
        </button>}
        <span className={css.lineNumber}>{scenarioLineLabel(props.order, lineIndex)}</span>
        <ScenarioTextInput
          id={`scenario-${props.step.id}-${lineIndex}`}
          value={line}
          label={`${props.ru ? "Шаг" : "Step"} ${scenarioLineLabel(props.order, lineIndex)}`}
          placeholder={lineIndex === 0
            ? (props.ru ? "Название шага" : "Step title")
            : (props.ru ? "Технический подшаг" : "Technical substep")}
          autoFocus={props.autoFocus && lineIndex === 0}
          className={css.lineInput}
          onChange={(value) => updateLine(lineIndex, value)}
          onKeyDown={(event) => handleLineKey(event, lineIndex)}
          onPaste={actionAttachments.paste}
        />
      </div>)}
      {!collapsed && <div className={css.actionAttachmentRow}>
        <ScenarioAttachmentControls fieldKey={`step:${props.step.id}:action`} stepId={props.step.id} />
      </div>}
    </div>

    {!collapsed && <div className={css.expectedBlock}>
      <span className={css.expectedLabel}>{props.ru ? "Ожидаемый результат" : "Expected result"}</span>
      <ScenarioTextInput
        id={`scenario-${props.step.id}-expected`}
        value={props.step.expectedResult}
        label={`${props.ru ? "Ожидаемый результат шага" : "Expected result for step"} ${props.order}`}
        placeholder={props.ru ? "Что должно произойти" : "What should happen"}
        className={css.expectedInput}
        onChange={(expectedResult) => props.onChange({ expectedResult })}
        onPaste={expectedAttachments.paste}
      />
      <ScenarioAttachmentControls fieldKey={`step:${props.step.id}:expected`} stepId={props.step.id} />
    </div>}

    {!collapsed && (props.step.testData || dataAttachments.pending.length > 0) && <div className={css.optionalData}>
      <ScenarioTextInput
        value={props.step.testData ?? ""}
        label={`${props.ru ? "Тестовые данные шага" : "Test data for step"} ${props.order}`}
        placeholder={props.ru ? "Тестовые данные — необязательно" : "Test data — optional"}
        className={css.dataInput}
        onChange={(testData) => props.onChange({ testData })}
        onPaste={dataAttachments.paste}
      />
      {(props.step.testData || dataAttachments.pending.length > 0) && <ScenarioAttachmentControls
        fieldKey={`step:${props.step.id}:data`}
        stepId={props.step.id}
      />}
    </div>}
  </article>;
}
