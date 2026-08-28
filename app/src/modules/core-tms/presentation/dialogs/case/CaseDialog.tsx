import { ChevronRight, Paperclip, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { TestCaseRevision, TestStep } from "../../../../../core/tms/contracts/legacy-contract";
import { createEmptyRevision } from "../../../helpers/cases/caseRevision";
import { createUid } from "../../../helpers/id/createUid";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { AttachmentLink } from "../../../attachments/presentation/link/AttachmentLink";
import { Field } from "../../common/field/Field";
import { Modal } from "../../common/modal/Modal";
import { getCaseDialogCopy } from "./copy";
import styles from "../../../tms.module.css";

export function CaseDialog({ value, onChange, folderPath, onFolderPath, folders, editing, onClose, onSubmit }: { value: TestCaseRevision; onChange: (value: TestCaseRevision) => void; folderPath: string; onFolderPath: (value: string) => void; folders: string[]; editing: boolean; onClose: () => void; onSubmit: (event: FormEvent, files: File[]) => void }) {
  const { locale } = useTmsLocale();
  const copy = getCaseDialogCopy(locale);
  const [files, setFiles] = useState<File[]>([]);
  const [evidenceOpen, setEvidenceOpen] = useState(editing || value.attachmentIds.length > 0);
  useEffect(() => {
    if (editing) return;
    const defaults = createEmptyRevision(locale);
    const component = ["Core product", "Основной продукт"].includes(value.component) ? defaults.component : value.component;
    const changeNote = ["Created in TMS", "Создано в TMS"].includes(value.changeNote) ? defaults.changeNote : value.changeNote;
    if (component !== value.component || changeNote !== value.changeNote) onChange({ ...value, component, changeNote });
  }, [editing, locale]);
  const patch = <K extends keyof TestCaseRevision>(key: K, next: TestCaseRevision[K]) => onChange({ ...value, [key]: next });
  const updateStep = (id: string, next: Partial<TestStep>) => patch("steps", value.steps.map((step) => step.id === id ? { ...step, ...next } : step));
  const updateChecklistItem = (id: string, next: Partial<TestCaseRevision["checklist"][number]>) => patch("checklist", value.checklist.map((item) => item.id === id ? { ...item, ...next } : item));

  return <Modal title={editing ? copy.editTitle : copy.createTitle} subtitle={`${folderPath} · ${copy[value.lifecycle]} · ${copy[value.priority]}`} onClose={onClose} wide drawer>
    <form onSubmit={(event) => onSubmit(event, files)} className={`${styles.drawerForm} ${styles.productionDrawerForm}`}>
      <div className={styles.drawerBody}>
        <section className={styles.drawerSection}>
          <div className={styles.drawerSectionHeading}><strong>{copy.basics}</strong></div>
          <div className={styles.formGrid}>
            <Field label={copy.title} wide><input required autoFocus value={value.title} onChange={(event) => patch("title", event.target.value)} placeholder={copy.titlePlaceholder} data-testid="case-title" /></Field>
            <Field label={copy.folder} wide><input required list="tms-folders" value={folderPath} onChange={(event) => onFolderPath(event.target.value.startsWith("/") ? event.target.value : `/${event.target.value}`)} placeholder={copy.folderPlaceholder} /><datalist id="tms-folders">{folders.map((folderName) => <option key={folderName}>{folderName}</option>)}</datalist></Field>
            <Field label={copy.description} wide><textarea className={styles.drawerTextarea} value={value.description} onChange={(event) => patch("description", event.target.value)} placeholder={copy.descriptionPlaceholder} /></Field>
          </div>
        </section>

        <section className={styles.drawerSection}>
          <div className={styles.drawerSectionHeading}><strong>{copy.procedure}</strong><span>{value.type === "checklist" ? copy.checklistItemsHint : copy.executionStepsHint}</span></div>
          <div className={styles.formGrid}>
            <Field label={copy.preconditions} wide><textarea className={styles.drawerTextarea} value={value.preconditions} onChange={(event) => patch("preconditions", event.target.value)} placeholder={copy.preconditionsPlaceholder} /></Field>
            <Field label={copy.testData} wide><textarea className={styles.drawerTextarea} value={value.testData} onChange={(event) => patch("testData", event.target.value)} placeholder={copy.testDataPlaceholder} /></Field>
          </div>
          {value.type === "checklist" ? <div className={styles.compactStepList}>{value.checklist.map((item, index) => <div key={item.id} className={styles.compactChecklistRow}><b>{index + 1}</b><textarea required value={item.text} onChange={(event) => updateChecklistItem(item.id, { text: event.target.value })} placeholder={copy.itemPlaceholder} /><label><input type="checkbox" checked={item.required} onChange={(event) => updateChecklistItem(item.id, { required: event.target.checked })} />{copy.required}</label><button type="button" className={styles.iconButton} aria-label={`${copy.removeChecklistItem} ${index + 1}`} disabled={value.checklist.length === 1} onClick={() => patch("checklist", value.checklist.filter((entry) => entry.id !== item.id).map((entry, itemIndex) => ({ ...entry, order: itemIndex + 1 })))}><Trash2 size={15} /></button></div>)}<button type="button" className={styles.compactAddButton} onClick={() => patch("checklist", [...value.checklist, { id: createUid("check"), order: value.checklist.length + 1, text: "", required: true }])}><Plus size={14} />{copy.addItem}</button></div> : <div className={styles.compactStepList}>{value.steps.map((step, index) => <div key={step.id} className={styles.compactStepRow}><b>{index + 1}</b><textarea required value={step.action} onChange={(event) => updateStep(step.id, { action: event.target.value })} placeholder={copy.actionPlaceholder} /><textarea required value={step.expectedResult} onChange={(event) => updateStep(step.id, { expectedResult: event.target.value })} placeholder={copy.expectedPlaceholder} /><button type="button" className={styles.iconButton} aria-label={`${copy.removeExecutionStep} ${index + 1}`} disabled={value.steps.length === 1} onClick={() => patch("steps", value.steps.filter((item) => item.id !== step.id).map((item, itemIndex) => ({ ...item, order: itemIndex + 1 })))}><Trash2 size={15} /></button></div>)}<button type="button" className={styles.compactAddButton} onClick={() => patch("steps", [...value.steps, { id: createUid("step"), order: value.steps.length + 1, action: "", expectedResult: "", required: true }])}><Plus size={14} />{copy.addStep}</button></div>}
        </section>

        <details className={styles.drawerDisclosure}>
          <summary><ChevronRight size={16} /><span>{copy.advanced}<small>{copy.advancedHint}</small></span></summary>
          <div className={`${styles.drawerDisclosureBody} ${styles.formGrid}`}>
            <Field label={copy.priority}><select value={value.priority} onChange={(event) => patch("priority", event.target.value as TestCaseRevision["priority"])}><option value="low">{copy.low}</option><option value="medium">{copy.medium}</option><option value="high">{copy.high}</option><option value="critical">{copy.critical}</option></select></Field>
            <Field label={copy.lifecycle}><select value={value.lifecycle} onChange={(event) => patch("lifecycle", event.target.value as TestCaseRevision["lifecycle"])}><option value="draft">{copy.draft}</option><option value="ready">{copy.ready}</option><option value="deprecated">{copy.deprecated}</option></select></Field>
            <Field label={copy.component}><input value={value.component} onChange={(event) => patch("component", event.target.value)} /></Field>
            <Field label={copy.estimate}><input type="number" min={1} value={value.estimatedMinutes ?? ""} onChange={(event) => patch("estimatedMinutes", event.target.value ? Number(event.target.value) : null)} /></Field>
            <Field label={copy.tags} wide><input value={value.tags.join(", ")} onChange={(event) => patch("tags", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} placeholder={copy.tagsPlaceholder} /></Field>
          </div>
        </details>

        <details className={styles.drawerDisclosure} open={evidenceOpen} onToggle={(event) => setEvidenceOpen(event.currentTarget.open)}>
          <summary><ChevronRight size={16} /><span>{copy.attachments}<small>{copy.evidenceHint}</small></span></summary>
          <div className={styles.drawerDisclosureBody}>
            <label className={styles.compactUpload}><Paperclip size={16} /><span>{copy.attachments}</span><input type="file" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []))} /></label>
            <div className={styles.compactFileList}>{value.attachmentIds.map((id) => <AttachmentLink key={id} attachmentId={id} />)}{files.map((file) => <span key={`${file.name}-${file.lastModified}`}>{file.name}<button type="button" aria-label={`${copy.removeAttachment} ${file.name}`} onClick={() => setFiles((current) => current.filter((item) => item !== file))}><X size={12} /></button></span>)}</div>
            {editing && <Field label={copy.revisionNote} wide><input value={value.changeNote} onChange={(event) => patch("changeNote", event.target.value)} placeholder={copy.revisionNotePlaceholder} /></Field>}
          </div>
        </details>
      </div>
      <div className={styles.modalFooter}><button type="button" className={styles.textButton} onClick={onClose}>{copy.cancel}</button><button className={styles.primaryButton} type="submit" data-testid="save-case" disabled={!value.title.trim() || !folderPath.trim()}><Save size={16} />{editing ? copy.saveRevision : copy.createTitle}</button></div>
    </form>
  </Modal>;
}
