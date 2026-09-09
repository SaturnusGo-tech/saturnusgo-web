import { OrganizationExtras } from "../../management/presentation/extras/OrganizationExtras";
import { WorkflowSelect } from "../../management/presentation/WorkflowSelect";
import { organizationCopy } from "../../management/model/copy";
import { validChecklist } from "../../management/model/organization";
import { useState } from "react";
import { PiCheck, PiFolderSimpleDuotone, PiPlus, PiSpinnerGap } from "react-icons/pi";
import type { Project } from "../../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { useProjectForm } from "../../../projects/state/dialog/useProjectForm";
import { useProjectPortfolioOptions } from "../../../projects/state/dialog/useProjectPortfolioOptions";
import { ResponsiblePicker } from "../../../workspace/members/presentation/ResponsiblePicker";
import { AnimatedSelect } from "../../../presentation/common/select/AnimatedSelect";
import { FormError } from "../../../presentation/common/error/FormError";
import { getProjectDialogCopy } from "../../../presentation/dialogs/project/copy";
import type { PortfolioCopy } from "../../model/copy";
import { OrganizationMarkdownField } from "./markdown/OrganizationMarkdownField";
import styles from "../styles/portfolios.module.css";
import css from "../styles/editor.module.css";

export function ProjectEditorPage({ workspaceId, canReadAttachments = false, canManageAttachments = false, current, etag, portfolioId, portfolioName, copy, onCreated, onUpdated, onCancel }: {
  workspaceId: string; canReadAttachments?: boolean; canManageAttachments?: boolean; current?: Project; etag?: string | null; portfolioId?: string; portfolioName?: string; copy: PortfolioCopy;
  onCreated: (project: Project) => void; onUpdated: (project: Project, etag: string | null) => void; onCancel: () => void;
}) {
  const { locale } = useTmsLocale();
  const [editingField, setEditingField] = useState<"description" | "plan" | null>(null);
  const formCopy = getProjectDialogCopy(locale);
  const form = useProjectForm({ workspaceId, project: current, projectEtag: etag, offline: false, portfolioId, errorText: copy.saveError });
  const checklist = form.checklist ?? [];
  const workflowPhase = form.workflowPhase ?? "new";
  const portfolios = useProjectPortfolioOptions(workspaceId, true);
  const options = [{ value: "", label: copy.noPortfolio }, ...portfolios.items.map((item) => ({ value: item.id, label: item.name }))];
  if (form.portfolioId && !portfolios.items.some((item) => item.id === form.portfolioId)) options.push({ value: form.portfolioId, label: portfolioName || copy.unknownPortfolio });
  return <form className={css.editor} aria-busy={form.pending || undefined} onSubmit={async (event) => {
    event.preventDefault();
    const result = await form.save();
    if (result) { if (current) onUpdated(result.data, result.etag); else onCreated(result.data); }
  }}>
    <header className={styles.heading}><PiFolderSimpleDuotone size={24} className={styles.projectIcon} aria-hidden="true" />
      <div className={css.titleField}><label className={styles.srOnly} htmlFor="project-title">{copy.projectName}</label>
        <input id="project-title" data-inline-title autoFocus required maxLength={120} disabled={form.pending} value={form.name}
          onChange={(event) => form.updateName(event.target.value)} placeholder={copy.projectName} data-testid="project-name" /></div>
      <div className={styles.actions}><button type="button" className={styles.secondary} disabled={form.pending} onClick={onCancel}>{copy.cancel}</button>
        <button className={styles.primary} disabled={form.pending || !validChecklist(checklist) || form.description.length > 20000 || form.testingPlan.length > 20000 || !form.name.trim() || form.key.trim().length < 2 || (!form.modified && !form.error)}>
          {form.pending ? <PiSpinnerGap className={styles.spin} /> : current ? <PiCheck /> : <PiPlus />}{form.pending ? copy.saving : current ? copy.save : copy.newProject}
        </button>
      </div>
    </header>
    <div className={styles.tabs}><span className={css.activeTab}>{copy.overview}</span></div>
    <div className={styles.detailGrid}><main className={css.mainFields}>
      <OrganizationMarkdownField label={copy.description} value={form.description} placeholder={copy.descriptionPlaceholder}
        editing={editingField === "description"} disabled={form.pending} onEdit={() => setEditingField("description")}
        onClose={() => setEditingField(null)} onChange={form.setDescription} />
      <OrganizationExtras target={current ? { workspaceId, targetType: "project", targetId: current.id } : undefined}
        canReadAttachments={canReadAttachments} canManageAttachments={canManageAttachments && current?.status !== "archived"}
        items={checklist} pending={form.pending} onChange={form.setChecklist} />
      <OrganizationMarkdownField label={copy.testingPlan} value={form.testingPlan} placeholder={copy.planPlaceholder}
        editing={editingField === "plan"} disabled={form.pending} onEdit={() => setEditingField("plan")}
        onClose={() => setEditingField(null)} onChange={form.setTestingPlan} />
      {form.error && <FormError message={form.error} />}
    </main><aside className={`${styles.sidebar} ${css.properties}`} aria-label={copy.properties}>
      <div className={css.property}><span>{organizationCopy(locale).phase}</span><WorkflowSelect value={workflowPhase} disabled={form.pending} onChange={form.setWorkflowPhase} /></div>
      <label className={css.property}><span>{copy.key}</span><input data-inline-title required disabled={form.pending || Boolean(current)} minLength={2} maxLength={12}
        pattern="[A-Z][A-Z0-9]{1,11}" value={form.key} onChange={(event) => form.setKey(event.target.value.replace(/[^a-z0-9]/gi, "").toUpperCase())}
        placeholder={formCopy.keyPlaceholder} aria-describedby="project-key-hint" /></label>
      {!current && <p className={`${css.note} ${styles.srOnly}`} id="project-key-hint">{formCopy.newKeyHint} <code>{form.key || formCopy.keyPlaceholder}-TC-1</code></p>}
      <div className={css.property}><span>{copy.portfolio}</span><AnimatedSelect label={copy.portfolio} value={form.portfolioId ?? ""} options={options}
        disabled={form.pending} onChange={(value) => form.setPortfolioId(value || null)} />
        {portfolios.error && <button type="button" className={styles.textButton} onClick={portfolios.retry}>{copy.optionsError} {copy.retry}</button>}
        {portfolios.cursor && <button type="button" className={styles.textButton} disabled={portfolios.loading} onClick={portfolios.more}>{copy.portfolioMore}</button>}
      </div>
      <div className={css.property}><span>{copy.responsible}</span><ResponsiblePicker workspaceId={workspaceId} value={form.responsibleIdentityId} onChange={form.setResponsibleIdentityId} disabled={form.pending} /></div>
    </aside></div>
  </form>;
}
