import { Plus, Trash2 } from "lucide-react";
import type {
  TestCaseRevision,
  TestStep,
} from "../../../../../../core/tms/contracts/legacy-contract";
import { canRemoveInspectorRow } from "../model";
import { MarkdownField } from "../markdown/MarkdownField";
import css from "../caseInspector.module.css";

type Props = {
  revision: TestCaseRevision;
  editing: boolean;
  autoFocus?: boolean;
  ru: boolean;
  onPatch: (next: Partial<TestCaseRevision>) => void;
};

export function InspectorSteps({ revision, editing, autoFocus = true, ru, onPatch }: Props) {
  function updateStep(id: string, next: Partial<TestStep>) {
    onPatch({
      steps: revision.steps.map((step) =>
        step.id === id ? { ...step, ...next } : step,
      ),
    });
  }

  function addStep() {
    const id = `step-${crypto.randomUUID()}`;
    if (revision.type === "checklist") {
      onPatch({
        checklist: [
          ...revision.checklist,
          { id, order: revision.checklist.length + 1, text: "", required: true },
        ],
      });
      return;
    }
    onPatch({
      steps: [
        ...revision.steps,
        {
          id,
          order: revision.steps.length + 1,
          action: "",
          expectedResult: "",
          required: true,
        },
      ],
    });
  }

  if (!editing) {
    const rows = revision.type === "checklist"
      ? revision.checklist.map((item) => ({
          id: item.id,
          order: item.order,
          action: item.text,
          testData: "",
          required: item.required,
          expectedResult: item.required
            ? (ru ? "Обязательная проверка" : "Required check")
            : "",
        }))
      : revision.steps;
    return <ol className={css.steps}>
      {rows.map((step) => <li key={step.id}>
        <span>{step.order}</span>
        <div>
          <MarkdownField
            value={step.action}
            label={ru ? "Действие" : "Action"}
            emptyLabel={ru ? "Действие не указано" : "No action"}
          />
          {step.expectedResult && <div className={css.stepResult}>
            <em>{ru ? "Ожидаемый результат" : "Expected result"}</em>
            <MarkdownField value={step.expectedResult} label={ru ? "Ожидаемый результат" : "Expected result"} />
          </div>}
          {step.testData && <div className={css.stepResult}>
            <em>{ru ? "Тестовые данные" : "Test data"}</em>
            <MarkdownField value={step.testData} label={ru ? "Тестовые данные" : "Test data"} />
          </div>}
        </div>
      </li>)}
    </ol>;
  }

  return <div className={css.stepEditor}>
    {revision.type === "checklist"
      ? revision.checklist.map((item, index) => <div className={css.editStep} key={item.id}>
          <b>{index + 1}</b>
          <MarkdownField
            compact
            autoFocus={autoFocus && index === 0}
            label={`${ru ? "Пункт" : "Item"} ${index + 1}`}
            value={item.text}
            onChange={(text) => onPatch({
              checklist: revision.checklist.map((entry) =>
                entry.id === item.id ? { ...entry, text } : entry,
              ),
            })}
          />
          <label className={css.requiredToggle}>
            <input type="checkbox" checked={item.required} onChange={(event) => onPatch({
              checklist: revision.checklist.map((entry) => entry.id === item.id
                ? { ...entry, required: event.target.checked } : entry),
            })} />{ru ? "Обязательный" : "Required"}
          </label>
          <RemoveButton
            label={ru ? "Удалить пункт" : "Remove item"}
            disabled={!canRemoveInspectorRow(revision.checklist.length)}
            onClick={() => onPatch({
              checklist: revision.checklist
                .filter((entry) => entry.id !== item.id)
                .map((entry, order) => ({ ...entry, order: order + 1 })),
            })}
          />
        </div>)
      : revision.steps.map((step, index) => <div className={css.editStep} key={step.id}>
          <b>{index + 1}</b>
          <label>
            <span>{ru ? "Действие" : "Action"}</span>
            <MarkdownField
              compact
              autoFocus={autoFocus && index === 0}
              label={`${ru ? "Действие" : "Action"} ${index + 1}`}
              value={step.action}
              onChange={(action) => updateStep(step.id, { action })}
            />
          </label>
          <label>
            <span>{ru ? "Ожидаемый результат" : "Expected result"}</span>
            <MarkdownField
              compact
              label={`${ru ? "Ожидаемый результат" : "Expected result"} ${index + 1}`}
              value={step.expectedResult}
              onChange={(expectedResult) => updateStep(step.id, { expectedResult })}
            />
          </label>
          <label>
            <span>{ru ? "Тестовые данные" : "Test data"}</span>
            <MarkdownField
              compact
              label={`${ru ? "Тестовые данные" : "Test data"} ${index + 1}`}
              value={step.testData ?? ""}
              onChange={(testData) => updateStep(step.id, { testData })}
            />
          </label>
          <label className={css.requiredToggle}>
            <input type="checkbox" checked={step.required} onChange={(event) => updateStep(step.id, { required: event.target.checked })} />
            {ru ? "Обязательный" : "Required"}
          </label>
          <RemoveButton
            label={ru ? "Удалить шаг" : "Remove step"}
            disabled={!canRemoveInspectorRow(revision.steps.length)}
            onClick={() => onPatch({
              steps: revision.steps
                .filter((entry) => entry.id !== step.id)
                .map((entry, order) => ({ ...entry, order: order + 1 })),
            })}
          />
        </div>)}
    <button type="button" autoFocus={autoFocus && (revision.type === "manual" ? revision.steps : revision.checklist).length === 0} className={css.addButton} onClick={addStep}>
      <Plus size={14} />{revision.type === "checklist" ? (ru ? "Добавить пункт" : "Add item") : (ru ? "Добавить шаг" : "Add step")}
    </button>
  </div>;
}

function RemoveButton({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return <button type="button" aria-label={label} disabled={disabled} onClick={onClick}>
    <Trash2 size={14} />
  </button>;
}
