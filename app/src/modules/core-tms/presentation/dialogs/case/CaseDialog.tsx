import { Check, ChevronLeft, ChevronRight, FilePlus2, ListChecks, Paperclip, Plus, Rocket, Save, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { TestCaseRevision, TestStep } from "../../../../../core/tms/contracts/legacy-contract";
import { createEmptyRevision, executableSteps } from "../../../helpers/cases/caseRevision";
import { createUid } from "../../../helpers/id/createUid";
import { formatCount } from "../../../localization/format/count";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { Field } from "../../common/field/Field";
import { Modal } from "../../common/modal/Modal";
import { getCaseDialogCopy } from "./copy";
import { AttachmentLink } from "../../../attachments/presentation/link/AttachmentLink";
import styles from "../../../tms.module.css";
export function CaseDialog({ value, onChange, folderPath, onFolderPath, folders, editing, onClose, onSubmit }: { value: TestCaseRevision; onChange: (value: TestCaseRevision) => void; folderPath: string; onFolderPath: (value: string) => void; folders: string[]; editing: boolean; onClose: () => void; onSubmit: (event: FormEvent, files: File[]) => void }) {
  const { locale } = useTmsLocale();
  const copy = getCaseDialogCopy(locale);
  const [stage, setStage] = useState<"basics" | "procedure" | "review">("basics");
  const [files, setFiles] = useState<File[]>([]);
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
  const applyTemplate = (template: "blank" | "smoke" | "checklist") => {
    if (template === "blank") onChange({ ...createEmptyRevision(locale), title: value.title });
    if (template === "smoke") onChange({ ...value, type: "manual", checklist: [], steps: value.steps.length ? value.steps : [{ id: createUid("step"), order: 1, action: "", expectedResult: "", required: true }], priority: "critical", lifecycle: "ready", tags: Array.from(new Set([...value.tags, "smoke"])), estimatedMinutes: 5 });
    if (template === "checklist") onChange({ ...value, type: "checklist", steps: [], checklist: value.checklist.length ? value.checklist : [{ id: createUid("check"), order: 1, text: copy.verifyExpectedCondition, required: true }], priority: "medium", tags: Array.from(new Set([...value.tags, "checklist"])) });
  };
  const procedureReady = value.type === "checklist"
    ? value.checklist.length > 0 && value.checklist.every((item) => item.text.trim())
    : value.steps.length > 0 && value.steps.every((step) => step.action.trim() && step.expectedResult.trim());
  const reviewEntries = executableSteps(value, locale);
  const reviewCount = value.type === "checklist"
    ? formatCount(locale, reviewEntries.length, ["check", "checks"], ["проверка", "проверки", "проверок"])
    : formatCount(locale, reviewEntries.length, ["step", "steps"], ["шаг", "шага", "шагов"]);
  const stageIndex = stage === "basics" ? 0 : stage === "procedure" ? 1 : 2;
  return <Modal title={editing ? copy.editTitle : copy.createTitle} subtitle={editing ? copy.editSubtitle : copy.createSubtitle} onClose={onClose} wide>
    <form onSubmit={(event) => onSubmit(event, files)} className={styles.wizardForm}>
      <div className={styles.wizardSteps}>
        {[{ id: "basics", label: copy.basics }, { id: "procedure", label: copy.procedure }, { id: "review", label: copy.review }].map((item, index) => <button key={item.id} type="button" className={`${stage === item.id ? styles.wizardStepActive : ""} ${index < stageIndex ? styles.wizardStepDone : ""}`} onClick={() => { if (index === 0 || value.title.trim()) setStage(item.id as typeof stage); }}><span>{index < stageIndex ? <Check size={14} /> : index + 1}</span>{item.label}</button>)}
      </div>
      <div className={styles.wizardBody}>
        {stage === "basics" && <div className={styles.wizardPane}>
          {!editing && <div className={styles.templateGrid}>
            <button type="button" onClick={() => applyTemplate("blank")}><FilePlus2 size={20} /><strong>{copy.blankManual}</strong><small>{copy.blankManualHint}</small></button>
            <button type="button" onClick={() => applyTemplate("smoke")}><Rocket size={20} /><strong>{copy.smokeCheck}</strong><small>{copy.smokeCheckHint}</small></button>
            <button type="button" onClick={() => applyTemplate("checklist")}><ListChecks size={20} /><strong>{copy.checklist}</strong><small>{copy.checklistHint}</small></button>
          </div>}
          <div className={styles.formGrid}>
            <Field label={copy.title} wide><input required autoFocus value={value.title} onChange={(event) => patch("title", event.target.value)} placeholder={copy.titlePlaceholder} data-testid="case-title" /></Field>
            <Field label={copy.folder} wide><input required list="tms-folders" value={folderPath} onChange={(event) => onFolderPath(event.target.value.startsWith("/") ? event.target.value : `/${event.target.value}`)} placeholder={copy.folderPlaceholder} /><datalist id="tms-folders">{folders.map((folderName) => <option key={folderName}>{folderName}</option>)}</datalist></Field>
            <Field label={copy.description} wide><textarea value={value.description} onChange={(event) => patch("description", event.target.value)} placeholder={copy.descriptionPlaceholder} /></Field>
            <Field label={copy.priority}><select value={value.priority} onChange={(event) => patch("priority", event.target.value as TestCaseRevision["priority"])}><option value="low">{copy.low}</option><option value="medium">{copy.medium}</option><option value="high">{copy.high}</option><option value="critical">{copy.critical}</option></select></Field>
            <Field label={copy.lifecycle}><select value={value.lifecycle} onChange={(event) => patch("lifecycle", event.target.value as TestCaseRevision["lifecycle"])}><option value="draft">{copy.draft}</option><option value="ready">{copy.ready}</option><option value="deprecated">{copy.deprecated}</option></select></Field>
            <Field label={copy.owner}><input value={value.ownerIdentityId ?? ""} disabled /></Field>
            <Field label={copy.component}><input value={value.component} onChange={(event) => patch("component", event.target.value)} /></Field>
            <Field label={copy.estimate}><input type="number" min={1} value={value.estimatedMinutes ?? ""} onChange={(event) => patch("estimatedMinutes", event.target.value ? Number(event.target.value) : null)} /></Field>
            <Field label={copy.tags}><input value={value.tags.join(", ")} onChange={(event) => patch("tags", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} placeholder={copy.tagsPlaceholder} /></Field>
          </div>
        </div>}
        {stage === "procedure" && <div className={styles.wizardPane}>
          <div className={styles.formGrid}>
            <Field label={copy.preconditions} wide><textarea value={value.preconditions} onChange={(event) => patch("preconditions", event.target.value)} placeholder={copy.preconditionsPlaceholder} /></Field>
            <Field label={copy.testData} wide><textarea value={value.testData} onChange={(event) => patch("testData", event.target.value)} placeholder={copy.testDataPlaceholder} /></Field>
          </div>
          {value.type === "checklist" ? <div className={styles.dialogSection}><div className={styles.sectionTitle}><div><h3>{copy.checklistItems}</h3><p>{copy.checklistItemsHint}</p></div><button type="button" className={styles.secondaryButton} onClick={() => patch("checklist", [...value.checklist, { id: createUid("check"), order: value.checklist.length + 1, text: "", required: true }])}><Plus size={15} /> {copy.addItem}</button></div><div className={styles.stepEditor}>{value.checklist.map((item, index) => <div key={item.id} className={styles.checklistEditorRow}><b>{index + 1}</b><textarea required value={item.text} onChange={(event) => updateChecklistItem(item.id, { text: event.target.value })} placeholder={copy.itemPlaceholder} /><label><input type="checkbox" checked={item.required} onChange={(event) => updateChecklistItem(item.id, { required: event.target.checked })} /> {copy.required}</label><button type="button" className={styles.iconButton} aria-label={`${copy.removeChecklistItem} ${index + 1}`} title={copy.removeChecklistItem} disabled={value.checklist.length === 1} onClick={() => patch("checklist", value.checklist.filter((entry) => entry.id !== item.id).map((entry, itemIndex) => ({ ...entry, order: itemIndex + 1 })))}><Trash2 size={16} /></button></div>)}</div></div> : <div className={styles.dialogSection}><div className={styles.sectionTitle}><div><h3>{copy.executionSteps}</h3><p>{copy.executionStepsHint}</p></div><button type="button" className={styles.secondaryButton} onClick={() => patch("steps", [...value.steps, { id: createUid("step"), order: value.steps.length + 1, action: "", expectedResult: "", required: true }])}><Plus size={15} /> {copy.addStep}</button></div><div className={styles.stepEditor}>{value.steps.map((step, index) => <div key={step.id} className={styles.stepEditorRow}><b>{index + 1}</b><textarea required value={step.action} onChange={(event) => updateStep(step.id, { action: event.target.value })} placeholder={copy.actionPlaceholder} /><textarea required value={step.expectedResult} onChange={(event) => updateStep(step.id, { expectedResult: event.target.value })} placeholder={copy.expectedPlaceholder} /><button type="button" className={styles.iconButton} aria-label={`${copy.removeExecutionStep} ${index + 1}`} title={copy.removeExecutionStep} disabled={value.steps.length === 1} onClick={() => patch("steps", value.steps.filter((item) => item.id !== step.id).map((item, itemIndex) => ({ ...item, order: itemIndex + 1 })))}><Trash2 size={16} /></button></div>)}</div></div>}
        </div>}
        {stage === "review" && <div className={styles.wizardPane}>
          <div className={styles.reviewHeader}><span className={styles.caseTypeIcon}><ListChecks size={22} /></span><div><small>{folderPath} · {copy[value.lifecycle]}</small><h3>{value.title}</h3><p>{value.description || copy.noDescription}</p></div></div>
          <div className={styles.reviewStats}><span>{reviewCount}</span><span><strong>{copy[value.priority]}</strong> {copy.priority.toLowerCase()}</span><span><strong>{value.estimatedMinutes ?? "—"}</strong> {copy.minuteShort}</span><span><strong>{value.ownerIdentityId ?? "—"}</strong> {copy.owner.toLowerCase()}</span></div>
          <div className={styles.reviewSteps}>{reviewEntries.map((step) => <div key={step.id}><b>{step.order}</b><span><strong>{step.action}</strong><small>{step.expectedResult}</small></span></div>)}</div>
          <div className={styles.evidenceFields}><label tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") event.currentTarget.querySelector("input")?.click(); }}><Paperclip size={17} /><span>{copy.attachments}</span><input type="file" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []))} /></label><div>{value.attachmentIds.map((id) => <AttachmentLink key={id} attachmentId={id} />)}{files.map((file) => <span key={`${file.name}-${file.lastModified}`}>{file.name}<button type="button" aria-label={`${copy.removeAttachment} ${file.name}`} title={copy.removeAttachment} onClick={() => setFiles((current) => current.filter((item) => item !== file))}><X size={12} /></button></span>)}</div></div>
          {editing && <Field label={copy.revisionNote} wide><input value={value.changeNote} onChange={(event) => patch("changeNote", event.target.value)} placeholder={copy.revisionNotePlaceholder} /></Field>}
        </div>}
      </div>
      <div className={styles.modalFooter}>
        <button type="button" className={styles.textButton} onClick={() => { if (stage === "basics") onClose(); else setStage(stage === "review" ? "procedure" : "basics"); }}>{stage === "basics" ? copy.cancel : <><ChevronLeft size={15} /> {copy.back}</>}</button>
        {stage !== "review" ? <button type="button" className={styles.primaryButton} disabled={stage === "basics" ? !value.title.trim() || !folderPath.trim() : !procedureReady} onClick={() => setStage(stage === "basics" ? "procedure" : "review")}>{copy.continue} <ChevronRight size={16} /></button> : <button className={styles.primaryButton} type="submit" data-testid="save-case"><Save size={16} /> {editing ? copy.saveRevision : copy.createTitle}</button>}
      </div>
    </form>
  </Modal>;
}
