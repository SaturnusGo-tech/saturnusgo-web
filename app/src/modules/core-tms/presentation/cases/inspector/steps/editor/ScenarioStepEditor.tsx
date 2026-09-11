"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { TestStep } from "../../../../../../../core/tms/contracts/legacy-contract";
import type { SharedStepSummary } from "../../../../../shared-steps/model/shared-step";
import {
  ScenarioAttachmentControls,
  SavedScenarioAttachments,
  useScenarioAttachments,
} from "../support/ScenarioAttachments";
import { ScenarioMarkdownInput } from "../markdown/ScenarioMarkdownInput";
import { StepActionMenu } from "../menu/StepActionMenu";
import css from "../scenarioSteps.module.css";

type Props = {
  step: TestStep;
  order: number;
  autoFocus: boolean;
  canRemove: boolean;
  ru: boolean;
  sharedSteps: readonly SharedStepSummary[];
  allowSharedSteps?: boolean;
  attachments?: ReactNode;
  attachmentScope?: "step";
  onChange: (next: Partial<TestStep>) => void;
  onAddAfter: (withExpectedResult: boolean) => void;
  onInsertShared: (id: string) => void;
  onDuplicate: () => void;
  onRemove: () => void;
};

export function ScenarioStepEditor(props: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const actionAttachments = useScenarioAttachments({
    fieldKey: `step:${props.step.id}:action`,
    stepId: props.step.id,
  });
  const expectedAttachments = useScenarioAttachments({
    fieldKey: `step:${props.step.id}:${props.attachmentScope ? "action" : "expected"}`,
    stepId: props.step.id,
  });
  const dataAttachments = useScenarioAttachments({
    fieldKey: `step:${props.step.id}:${props.attachmentScope ? "action" : "data"}`,
    stepId: props.step.id,
  });

  return <article className={css.stepGroup}>
    <div className={css.stepMenu}><StepActionMenu ru={props.ru}
      sharedSteps={props.sharedSteps} canRemove={props.canRemove}
      allowSharedSteps={props.allowSharedSteps}
      onAdd={props.onAddAfter} onInsertShared={props.onInsertShared}
      onDuplicate={props.onDuplicate} onRemove={props.onRemove} /></div>
    <div className={css.actionLines}>
      <div data-input-shell className={`${css.actionLine} ${css.primaryLine}`}>
        <button type="button" className={css.collapseButton}
          aria-expanded={!collapsed}
          aria-label={collapsed
            ? (props.ru ? `Развернуть шаг ${props.order}` : `Expand step ${props.order}`)
            : (props.ru ? `Свернуть шаг ${props.order}` : `Collapse step ${props.order}`)}
          onClick={() => setCollapsed((value) => !value)}>
          {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
        </button>
        <span className={css.lineNumber}>{props.order}</span>
        {collapsed ? <p className={css.collapsedCopy}>{props.step.action.split("\n")[0] || (props.ru ? "Шаг" : "Step")}</p>
          : <ScenarioMarkdownInput
            id={`scenario-${props.step.id}-0`} ru={props.ru}
            value={props.step.action} label={`${props.ru ? "Шаг" : "Step"} ${props.order}`}
            placeholder={props.ru ? "Действие или запрос" : "Action or request"}
            autoFocus={props.autoFocus}
            onChange={(action) => props.onChange({ action })}
            onPaste={actionAttachments.paste} />}
      </div>
      {!collapsed && !props.attachmentScope && <div className={css.actionAttachmentRow}>
        <ScenarioAttachmentControls fieldKey={`step:${props.step.id}:action`} stepId={props.step.id} />
      </div>}
    </div>

    {!collapsed && <div className={css.expectedBlock} data-input-shell>
      <span className={css.expectedLabel}>{props.ru ? "Ожидаемый результат" : "Expected result"}</span>
      <ScenarioMarkdownInput ru={props.ru}
        id={`scenario-${props.step.id}-expected`}
        value={props.step.expectedResult}
        label={`${props.ru ? "Ожидаемый результат шага" : "Expected result for step"} ${props.order}`}
        placeholder={props.ru ? "Что должно произойти" : "What should happen"}
        onChange={(expectedResult) => props.onChange({ expectedResult })}
        onPaste={expectedAttachments.paste}
      />
      {!props.attachmentScope && <ScenarioAttachmentControls fieldKey={`step:${props.step.id}:expected`} stepId={props.step.id} />}
    </div>}

    {!collapsed && (props.step.testData || (!props.attachmentScope && dataAttachments.pending.length > 0)) && <div className={css.optionalData} data-input-shell>
      <ScenarioMarkdownInput ru={props.ru}
        value={props.step.testData ?? ""}
        label={`${props.ru ? "Тестовые данные шага" : "Test data for step"} ${props.order}`}
        placeholder={props.ru ? "Тестовые данные (необязательно)" : "Test data (optional)"}
        onChange={(testData) => props.onChange({ testData })}
        onPaste={dataAttachments.paste}
      />
      {!props.attachmentScope && (props.step.testData || dataAttachments.pending.length > 0) && <ScenarioAttachmentControls
        fieldKey={`step:${props.step.id}:data`}
        stepId={props.step.id}
      />}
    </div>}
    {!collapsed && props.attachmentScope && <ScenarioAttachmentControls
      fieldKey={`step:${props.step.id}:action`} stepId={props.step.id} />}
    {!collapsed && !props.attachmentScope && <SavedScenarioAttachments ids={props.step.attachmentIds} />}
    {!collapsed && props.attachments}
  </article>;
}
