"use client";

import { Plus, Trash2 } from "lucide-react";
import type {
  TestCaseRevision,
  TestStep,
} from "../../../../../../core/tms/contracts/legacy-contract";
import type { SharedStep, SharedStepSummary } from "../../../../shared-steps/model/shared-step";
import { canRemoveInspectorRow } from "../model";
import {
  ScenarioAttachmentControls,
  useScenarioAttachments,
} from "./support/ScenarioAttachments";
import { ScenarioStepEditor } from "./editor/ScenarioStepEditor";
import { StepActionMenu } from "./menu/StepActionMenu";
import { SharedStepBlock } from "./shared/SharedStepBlock";
import { ScenarioTextInput } from "./editor/ScenarioTextInput";
import { ScenarioStepView } from "./viewer/ScenarioStepView";
import {
  duplicateStepAfter, emptyScenarioStep, insertStepAfter, sharedScenarioStep,
} from "./stepOperations";
import css from "./scenarioSteps.module.css";

type Props = {
  revision: TestCaseRevision;
  editing: boolean;
  autoFocus?: boolean;
  ru: boolean;
  sharedSteps: readonly SharedStepSummary[];
  onResolveSharedStep: (id: string) => Promise<SharedStep | null>;
  onPatch: (next: Partial<TestCaseRevision>) => void;
};

export function InspectorSteps({
  revision, editing, autoFocus = true, ru, sharedSteps, onResolveSharedStep, onPatch,
}: Props) {
  function updateStep(id: string, next: Partial<TestStep>) {
    onPatch({
      steps: revision.steps.map((step) => step.id === id ? { ...step, ...next } : step),
    });
  }

  function addStep() {
    const id = `step-${crypto.randomUUID()}`;
    if (revision.type === "checklist") {
      onPatch({ checklist: [
        ...revision.checklist,
        { id, order: revision.checklist.length + 1, text: "", required: true },
      ] });
      requestAnimationFrame(() => document.getElementById(`checklist-${id}`)?.focus());
      return;
    }
    const step = emptyScenarioStep(revision.steps.length + 1);
    onPatch({ steps: [...revision.steps, step] });
    requestAnimationFrame(() => document.getElementById(`scenario-${step.id}-0`)?.focus());
  }

  function addAfter(index: number, withExpectedResult: boolean) {
    const step = emptyScenarioStep(index + 2);
    onPatch({ steps: insertStepAfter(revision.steps, index, step) });
    requestAnimationFrame(() => document.getElementById(withExpectedResult
      ? `scenario-${step.id}-expected` : `scenario-${step.id}-0`)?.focus());
  }

  async function insertSharedAfter(index: number, id: string) {
    const value = await onResolveSharedStep(id);
    if (!value) return;
    const snapshot = { id: value.id, title: value.current.title,
      revision: value.currentRevision, items: value.current.items.map((item) => ({ ...item,
        attachmentIds: [...item.attachmentIds] })) };
    onPatch({ steps: insertStepAfter(revision.steps, index, sharedScenarioStep(index + 2, snapshot)) });
  }

  const duplicate = (index: number) => onPatch({ steps: duplicateStepAfter(revision.steps, index) });
  const remove = (id: string) => onPatch({ steps: revision.steps
    .filter((entry) => entry.id !== id).map((entry, order) => ({ ...entry, order: order + 1 })) });

  if (!editing) {
    if (revision.type === "checklist") {
      return <ol className={css.checklistView}>
        {revision.checklist.map((item, index) => <li key={item.id}>
          <span>{index + 1}</span>
          <p>{item.text || (ru ? "Пункт не указан" : "No item")}</p>
        </li>)}
      </ol>;
    }
    return <div className={css.scenarioView}>
      {revision.steps.map((step, index) => step.sharedStep
        ? <SharedStepBlock key={step.id} snapshot={step.sharedStep} order={index + 1}
          editing={false} ru={ru} sharedSteps={sharedSteps}
          canRemove={false} onAdd={() => undefined} onInsertShared={() => undefined}
          onDuplicate={() => undefined} onRemove={() => undefined} />
        : <ScenarioStepView key={step.id} step={step} order={index + 1} ru={ru} />)}
    </div>;
  }

  return <div className={css.editor}>
    {revision.type === "checklist"
      ? revision.checklist.map((item, index) => <ChecklistRow
          key={item.id}
          id={item.id}
          order={index + 1}
          text={item.text}
          required={item.required}
          autoFocus={autoFocus && index === 0}
          canRemove={canRemoveInspectorRow(revision.checklist.length)}
          ru={ru}
          onChange={(next) => onPatch({ checklist: revision.checklist.map((entry) => (
            entry.id === item.id ? { ...entry, ...next } : entry
          )) })}
          onRemove={() => onPatch({ checklist: revision.checklist
            .filter((entry) => entry.id !== item.id)
            .map((entry, order) => ({ ...entry, order: order + 1 })) })}
        />)
      : revision.steps.map((step, index) => step.sharedStep
        ? <SharedStepBlock key={step.id} snapshot={step.sharedStep} order={index + 1}
          editing ru={ru} sharedSteps={sharedSteps}
          canRemove={canRemoveInspectorRow(revision.steps.length)}
          onAdd={(withExpected) => addAfter(index, withExpected)}
          onInsertShared={(id) => void insertSharedAfter(index, id)}
          onDuplicate={() => duplicate(index)} onRemove={() => remove(step.id)} />
        : <ScenarioStepEditor key={step.id} step={step} order={index + 1}
          autoFocus={autoFocus && index === 0}
          canRemove={canRemoveInspectorRow(revision.steps.length)} ru={ru}
          sharedSteps={sharedSteps}
          onChange={(next) => updateStep(step.id, next)}
          onAddAfter={(withExpected) => addAfter(index, withExpected)}
          onInsertShared={(id) => void insertSharedAfter(index, id)}
          onDuplicate={() => duplicate(index)} onRemove={() => remove(step.id)} />)}
    {revision.type === "checklist"
      ? <button type="button" className={css.addStepButton} onClick={addStep}><Plus size={15} />
          {ru ? "Добавить пункт" : "Add item"}</button>
      : <div className={css.addStepMenu}><StepActionMenu trigger="add" ru={ru}
          sharedSteps={sharedSteps} onAdd={(withExpected) => addAfter(revision.steps.length - 1, withExpected)}
          onInsertShared={(id) => void insertSharedAfter(revision.steps.length - 1, id)} /></div>}
  </div>;
}

function ChecklistRow(props: {
  id: string;
  order: number;
  text: string;
  required: boolean;
  autoFocus: boolean;
  canRemove: boolean;
  ru: boolean;
  onChange: (next: { text?: string; required?: boolean }) => void;
  onRemove: () => void;
}) {
  const attachments = useScenarioAttachments({ fieldKey: `checklist:${props.id}` });
  return <div className={css.checklistRow}>
    <span className={css.lineNumber}>{props.order}</span>
    <div>
      <ScenarioTextInput id={`checklist-${props.id}`} value={props.text}
        label={`${props.ru ? "Пункт" : "Item"} ${props.order}`}
        placeholder={props.ru ? "Проверка" : "Check"}
        autoFocus={props.autoFocus} className={css.lineInput}
        onChange={(text) => props.onChange({ text })} onPaste={attachments.paste} />
      <ScenarioAttachmentControls fieldKey={`checklist:${props.id}`} />
    </div>
    <label className={css.checklistRequired}>
      <input type="checkbox" checked={props.required}
        onChange={(event) => props.onChange({ required: event.target.checked })} />
      {props.ru ? "Обязательный" : "Required"}
    </label>
    <button type="button" className={css.removeButton} disabled={!props.canRemove}
      onClick={props.onRemove} aria-label={props.ru ? "Удалить пункт" : "Remove item"}>
      <Trash2 size={14} />
    </button>
  </div>;
}
