import { Check, ChevronLeft, ChevronRight, FilePlus2, ListChecks, Paperclip, Plus, Rocket, Save, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import type { TestCaseRevision, TestStep } from "../../../../../core/tms/contracts/legacy-contract";
import { createEmptyRevision, executableSteps } from "../../../helpers/cases/caseRevision";
import { createUid } from "../../../helpers/id/createUid";
import { Field } from "../../common/field/Field";
import { Modal } from "../../common/modal/Modal";
import styles from "../../../tms.module.css";
export function CaseDialog({ value, onChange, folderPath, onFolderPath, folders, editing, onClose, onSubmit }: { value: TestCaseRevision; onChange: (value: TestCaseRevision) => void; folderPath: string; onFolderPath: (value: string) => void; folders: string[]; editing: boolean; onClose: () => void; onSubmit: (event: FormEvent) => void }) {
  const [stage, setStage] = useState<"basics" | "procedure" | "review">("basics");
  const patch = <K extends keyof TestCaseRevision>(key: K, next: TestCaseRevision[K]) => onChange({ ...value, [key]: next });
  const updateStep = (id: string, next: Partial<TestStep>) => patch("steps", value.steps.map((step) => step.id === id ? { ...step, ...next } : step));
  const updateChecklistItem = (id: string, next: Partial<TestCaseRevision["checklist"][number]>) => patch("checklist", value.checklist.map((item) => item.id === id ? { ...item, ...next } : item));
  const applyTemplate = (template: "blank" | "smoke" | "checklist") => {
    if (template === "blank") onChange({ ...createEmptyRevision(), title: value.title });
    if (template === "smoke") onChange({ ...value, type: "manual", checklist: [], steps: value.steps.length ? value.steps : [{ id: createUid("step"), order: 1, action: "", expectedResult: "", required: true }], priority: "critical", lifecycle: "ready", tags: Array.from(new Set([...value.tags, "smoke"])), estimatedMinutes: 5 });
    if (template === "checklist") onChange({ ...value, type: "checklist", steps: [], checklist: value.checklist.length ? value.checklist : [{ id: createUid("check"), order: 1, text: "Verify the expected condition", required: true }], priority: "medium", tags: Array.from(new Set([...value.tags, "checklist"])) });
  };
  const procedureReady = value.type === "checklist"
    ? value.checklist.length > 0 && value.checklist.every((item) => item.text.trim())
    : value.steps.length > 0 && value.steps.every((step) => step.action.trim() && step.expectedResult.trim());
  const reviewEntries = executableSteps(value);
  const stageIndex = stage === "basics" ? 0 : stage === "procedure" ? 1 : 2;
  return <Modal title={editing ? "Edit test case" : "Create test case"} subtitle={editing ? "Saving creates a new immutable revision." : "A guided flow for a repeatable manual verification."} onClose={onClose} wide>
    <form onSubmit={onSubmit} className={styles.wizardForm}>
      <div className={styles.wizardSteps}>
        {[{ id: "basics", label: "1. Basics" }, { id: "procedure", label: "2. Procedure" }, { id: "review", label: "3. Review" }].map((item, index) => <button key={item.id} type="button" className={`${stage === item.id ? styles.wizardStepActive : ""} ${index < stageIndex ? styles.wizardStepDone : ""}`} onClick={() => { if (index === 0 || value.title.trim()) setStage(item.id as typeof stage); }}><span>{index < stageIndex ? <Check size={14} /> : index + 1}</span>{item.label.slice(3)}</button>)}
      </div>
      <div className={styles.wizardBody}>
        {stage === "basics" && <div className={styles.wizardPane}>
          {!editing && <div className={styles.templateGrid}>
            <button type="button" onClick={() => applyTemplate("blank")}><FilePlus2 size={20} /><strong>Blank manual</strong><small>Start with one empty step</small></button>
            <button type="button" onClick={() => applyTemplate("smoke")}><Rocket size={20} /><strong>Smoke check</strong><small>Critical and ready to run</small></button>
            <button type="button" onClick={() => applyTemplate("checklist")}><ListChecks size={20} /><strong>Checklist</strong><small>Fast repeated verification</small></button>
          </div>}
          <div className={styles.formGrid}>
            <Field label="Test case title" wide><input required autoFocus value={value.title} onChange={(event) => patch("title", event.target.value)} placeholder="User can complete checkout" data-testid="case-title" /></Field>
            <Field label="Repository folder" wide><input required list="tms-folders" value={folderPath} onChange={(event) => onFolderPath(event.target.value.startsWith("/") ? event.target.value : `/${event.target.value}`)} placeholder="/Checkout" /><datalist id="tms-folders">{folders.map((folderName) => <option key={folderName}>{folderName}</option>)}</datalist></Field>
            <Field label="Description" wide><textarea value={value.description} onChange={(event) => patch("description", event.target.value)} placeholder="What behavior and risk does this test cover?" /></Field>
            <Field label="Priority"><select value={value.priority} onChange={(event) => patch("priority", event.target.value as TestCaseRevision["priority"])}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></Field>
            <Field label="Lifecycle"><select value={value.lifecycle} onChange={(event) => patch("lifecycle", event.target.value as TestCaseRevision["lifecycle"])}><option value="draft">Draft</option><option value="ready">Ready</option><option value="deprecated">Deprecated</option></select></Field>
            <Field label="Owner"><input value={value.owner} onChange={(event) => patch("owner", event.target.value)} /></Field>
            <Field label="Component"><input value={value.component} onChange={(event) => patch("component", event.target.value)} /></Field>
            <Field label="Estimate, minutes"><input type="number" min={1} value={value.estimatedMinutes ?? ""} onChange={(event) => patch("estimatedMinutes", event.target.value ? Number(event.target.value) : null)} /></Field>
            <Field label="Tags"><input value={value.tags.join(", ")} onChange={(event) => patch("tags", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} placeholder="smoke, regression" /></Field>
          </div>
        </div>}
        {stage === "procedure" && <div className={styles.wizardPane}>
          <div className={styles.formGrid}>
            <Field label="Preconditions" wide><textarea value={value.preconditions} onChange={(event) => patch("preconditions", event.target.value)} placeholder="State required before the tester starts" /></Field>
            <Field label="Test data" wide><textarea value={value.testData} onChange={(event) => patch("testData", event.target.value)} placeholder="Accounts, payloads, feature flags, or fixtures" /></Field>
          </div>
          {value.type === "checklist" ? <div className={styles.dialogSection}><div className={styles.sectionTitle}><div><h3>Checklist items</h3><p>Each required item must be confirmed before the case can pass.</p></div><button type="button" className={styles.secondaryButton} onClick={() => patch("checklist", [...value.checklist, { id: createUid("check"), order: value.checklist.length + 1, text: "", required: true }])}><Plus size={15} /> Add item</button></div><div className={styles.stepEditor}>{value.checklist.map((item, index) => <div key={item.id} className={styles.checklistEditorRow}><b>{index + 1}</b><textarea required value={item.text} onChange={(event) => updateChecklistItem(item.id, { text: event.target.value })} placeholder="Condition to verify" /><label><input type="checkbox" checked={item.required} onChange={(event) => updateChecklistItem(item.id, { required: event.target.checked })} /> Required</label><button type="button" className={styles.iconButton} aria-label={`Remove checklist item ${index + 1}`} title="Remove checklist item" disabled={value.checklist.length === 1} onClick={() => patch("checklist", value.checklist.filter((entry) => entry.id !== item.id).map((entry, itemIndex) => ({ ...entry, order: itemIndex + 1 })))}><Trash2 size={16} /></button></div>)}</div></div> : <div className={styles.dialogSection}><div className={styles.sectionTitle}><div><h3>Execution steps</h3><p>Write one action and one observable result per row.</p></div><button type="button" className={styles.secondaryButton} onClick={() => patch("steps", [...value.steps, { id: createUid("step"), order: value.steps.length + 1, action: "", expectedResult: "", required: true }])}><Plus size={15} /> Add step</button></div><div className={styles.stepEditor}>{value.steps.map((step, index) => <div key={step.id} className={styles.stepEditorRow}><b>{index + 1}</b><textarea required value={step.action} onChange={(event) => updateStep(step.id, { action: event.target.value })} placeholder="Tester action" /><textarea required value={step.expectedResult} onChange={(event) => updateStep(step.id, { expectedResult: event.target.value })} placeholder="Observable expected result" /><button type="button" className={styles.iconButton} aria-label={`Remove execution step ${index + 1}`} title="Remove execution step" disabled={value.steps.length === 1} onClick={() => patch("steps", value.steps.filter((item) => item.id !== step.id).map((item, itemIndex) => ({ ...item, order: itemIndex + 1 })))}><Trash2 size={16} /></button></div>)}</div></div>}
        </div>}
        {stage === "review" && <div className={styles.wizardPane}>
          <div className={styles.reviewHeader}><span className={styles.caseTypeIcon}><ListChecks size={22} /></span><div><small>{folderPath} · {value.lifecycle}</small><h3>{value.title}</h3><p>{value.description || "No description"}</p></div></div>
          <div className={styles.reviewStats}><span><strong>{reviewEntries.length}</strong> {value.type === "checklist" ? reviewEntries.length === 1 ? "check" : "checks" : reviewEntries.length === 1 ? "step" : "steps"}</span><span><strong>{value.priority}</strong> priority</span><span><strong>{value.estimatedMinutes ?? "—"}</strong> min</span><span><strong>{value.owner}</strong> owner</span></div>
          <div className={styles.reviewSteps}>{reviewEntries.map((step) => <div key={step.id}><b>{step.order}</b><span><strong>{step.action}</strong><small>{step.expectedResult}</small></span></div>)}</div>
          <div className={styles.evidenceFields}><label tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") event.currentTarget.querySelector("input")?.click(); }}><Paperclip size={17} /><span>Add screenshots, video, or supporting files</span><input type="file" multiple onChange={(event) => patch("attachmentIds", [...value.attachmentIds, ...Array.from(event.target.files ?? []).map((file) => file.name)])} /></label><div>{value.attachmentIds.map((name) => <span key={name}>{name}<button type="button" aria-label={`Remove attachment ${name}`} title="Remove attachment" onClick={() => patch("attachmentIds", value.attachmentIds.filter((item) => item !== name))}><X size={12} /></button></span>)}</div></div>
          {editing && <Field label="Revision note" wide><input value={value.changeNote} onChange={(event) => patch("changeNote", event.target.value)} placeholder="What changed?" /></Field>}
        </div>}
      </div>
      <div className={styles.modalFooter}>
        <button type="button" className={styles.textButton} onClick={() => { if (stage === "basics") onClose(); else setStage(stage === "review" ? "procedure" : "basics"); }}>{stage === "basics" ? "Cancel" : <><ChevronLeft size={15} /> Back</>}</button>
        {stage !== "review" ? <button type="button" className={styles.primaryButton} disabled={stage === "basics" ? !value.title.trim() || !folderPath.trim() : !procedureReady} onClick={() => setStage(stage === "basics" ? "procedure" : "review")}>Continue <ChevronRight size={16} /></button> : <button className={styles.primaryButton} type="submit" data-testid="save-case"><Save size={16} /> {editing ? "Save revision" : "Create test case"}</button>}
      </div>
    </form>
  </Modal>;
}
