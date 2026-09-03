"use client";

import { ArrowLeft, Plus, Save } from "lucide-react";
import type { TestStep } from "../../../../core/tms/contracts/legacy-contract";
import type { SharedStepDraft } from "../../shared-steps/model/shared-step";
import { ScenarioStepEditor } from "../cases/inspector/steps/editor/ScenarioStepEditor";
import styles from "./sharedSteps.module.css";

export function SharedStepEditor({ draft, saving, ru, onChange, onCancel, onSave }: {
  draft: SharedStepDraft;
  saving: boolean;
  ru: boolean;
  onChange: (draft: SharedStepDraft) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const updateItem = (id: string, patch: Partial<TestStep>) => onChange({ ...draft,
    items: draft.items.map((item) => item.id === id ? { ...item, ...patch } : item) });
  const removeItem = (id: string) => onChange({ ...draft,
    items: draft.items.filter((item) => item.id !== id)
      .map((item, index) => ({ ...item, order: index + 1 })) });
  const addItem = () => {
    const id = `shared-item-${crypto.randomUUID()}`;
    onChange({ ...draft, items: [...draft.items, { id, order: draft.items.length + 1,
      action: "", expectedResult: "", testData: "", required: true, attachmentIds: [] }] });
    requestAnimationFrame(() => document.getElementById(`scenario-${id}-0`)?.focus());
  };
  const addAfter = (index: number, withExpectedResult: boolean) => {
    const id = `shared-item-${crypto.randomUUID()}`;
    const items = [...draft.items];
    items.splice(index + 1, 0, { id, order: index + 2, action: "", expectedResult: "",
      testData: "", required: true, attachmentIds: [] });
    onChange({ ...draft, items: items.map((item, order) => ({ ...item, order: order + 1 })) });
    requestAnimationFrame(() => document.getElementById(withExpectedResult
      ? `scenario-${id}-expected` : `scenario-${id}-0`)?.focus());
  };
  const duplicate = (index: number) => {
    const source = draft.items[index];
    if (!source) return;
    const items = [...draft.items];
    items.splice(index + 1, 0, { ...source, id: `shared-item-${crypto.randomUUID()}`,
      attachmentIds: [...source.attachmentIds] });
    onChange({ ...draft, items: items.map((item, order) => ({ ...item, order: order + 1 })) });
  };
  const valid = draft.title.trim() && draft.items.length > 0 &&
    draft.items.every((item) => item.action.trim() && item.expectedResult.trim());
  return <section className={styles.editor} aria-label={ru ? "Редактор общего шага" : "Shared step editor"}>
    <header className={styles.editorHeader}>
      <button type="button" className={styles.iconButton} onClick={onCancel}
        aria-label={ru ? "Вернуться к списку" : "Back to list"}><ArrowLeft size={18} /></button>
      <div className={styles.titleField}>
        <span>{ru ? "Общий шаг" : "Shared step"}</span>
        <input autoFocus value={draft.title} onChange={(event) => onChange({ ...draft,
          title: event.target.value })} placeholder={ru ? "Например, авторизация" : "For example, authentication"} />
      </div>
      <div className={styles.editorActions}>
        <button type="button" className={styles.secondaryButton} onClick={onCancel} disabled={saving}>
          {ru ? "Отмена" : "Cancel"}
        </button>
        <button type="button" className={styles.primaryButton} onClick={onSave}
          disabled={saving || !valid}><Save size={15} />{saving
            ? (ru ? "Сохранение…" : "Saving…") : (ru ? "Сохранить" : "Save")}</button>
      </div>
    </header>
    <div className={styles.editorScroll}>
      <div className={styles.paper}>
        <div className={styles.scenarioHeading}>
          <h2>{ru ? "Сценарий" : "Scenario"}</h2>
          <span>{draft.items.length}</span>
        </div>
        <div className={styles.sharedRail}>
          {draft.items.map((item, index) => <ScenarioStepEditor key={item.id}
            step={{ ...item, attachmentIds: [...item.attachmentIds] }} order={index + 1}
            autoFocus={false} canRemove={draft.items.length > 1} ru={ru}
            sharedSteps={[]} allowSharedSteps={false}
            onChange={(patch) => updateItem(item.id, patch)}
            onAddAfter={(withExpected) => addAfter(index, withExpected)}
            onInsertShared={() => undefined} onDuplicate={() => duplicate(index)}
            onRemove={() => removeItem(item.id)} />)}
          <button type="button" className={styles.addButton} onClick={addItem}>
            <Plus size={15} />{ru ? "Добавить шаг" : "Add step"}
          </button>
        </div>
      </div>
    </div>
  </section>;
}
