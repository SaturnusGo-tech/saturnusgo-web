import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { OrganizationExtras } from "../../management/presentation/extras/OrganizationExtras";
import { WorkflowSelect } from "../../management/presentation/WorkflowSelect";
import { organizationCopy } from "../../management/model/copy";
import { validChecklist } from "../../management/model/organization";
import { useState } from "react";
import { PiBriefcaseDuotone, PiCheck, PiPlus, PiSpinnerGap } from "react-icons/pi";
import type { TmsMutationFailure } from "../../../../../core/tms/errors/mutation-failure";
import { formatTmsMutationFailure } from "../../../../../core/tms/errors/mutation-failure";
import { FormError } from "../../../presentation/common/error/FormError";
import { ResponsiblePicker } from "../../../workspace/members/presentation/ResponsiblePicker";
import type { Portfolio, PortfolioDraft } from "../../model/portfolio";
import type { PortfolioCopy } from "../../model/copy";
import { OrganizationMarkdownField } from "./markdown/OrganizationMarkdownField";
import styles from "../styles/portfolios.module.css";
import css from "../styles/editor.module.css";

export function PortfolioEditorPage({ workspaceId, canReadAttachments = false, canManageAttachments = false, current, copy, pending, error, onSave, onCancel }: {
  workspaceId: string; canReadAttachments?: boolean; canManageAttachments?: boolean; current?: Portfolio; copy: PortfolioCopy; pending: boolean; error: TmsMutationFailure | null;
  onSave: (draft: PortfolioDraft) => Promise<void>; onCancel: () => void;
}) {
  const { locale } = useTmsLocale();
  const [workflowPhase, setWorkflowPhase] = useState(current?.workflowPhase ?? "new");
  const [checklistDraft, setChecklist] = useState(current?.checklist ?? []);
  const checklist = checklistDraft ?? [];
  const [editingDescription, setEditingDescription] = useState(false);
  const [name, setName] = useState(current?.name ?? "");
  const [description, setDescription] = useState(current?.description ?? "");
  const [responsibleIdentityId, setResponsibleIdentityId] = useState(current?.responsibleIdentityId ?? null);
  const modified = !current || workflowPhase !== (current.workflowPhase ?? "new") || JSON.stringify(checklist) !== JSON.stringify(current.checklist ?? []) || name.trim() !== current.name || description.trim() !== current.description || responsibleIdentityId !== current.responsibleIdentityId;
  return <form className={css.editor} onSubmit={(event) => { event.preventDefault(); void onSave({ name, description, responsibleIdentityId, workflowPhase, checklist }); }} aria-busy={pending || undefined}>
    <header className={styles.heading}>
      <PiBriefcaseDuotone size={24} className={styles.portfolioIcon} aria-hidden="true" />
      <div className={css.titleField}><label className={styles.srOnly} htmlFor="portfolio-title">{copy.portfolioTitle}</label>
        <input id="portfolio-title" data-inline-title autoFocus required maxLength={120} disabled={pending} value={name} onChange={(event) => setName(event.target.value)} placeholder={copy.portfolioTitle} />
      </div>
      <div className={styles.actions}><button type="button" className={styles.secondary} disabled={pending} onClick={onCancel}>{copy.cancel}</button>
        <button className={styles.primary} disabled={pending || !validChecklist(checklist) || description.length > 20000 || !name.trim() || !modified}>
          {pending ? <PiSpinnerGap className={styles.spin} /> : current ? <PiCheck /> : <PiPlus />}{pending ? copy.saving : current ? copy.save : copy.createPortfolio}
        </button>
      </div>
    </header>
    <div className={styles.tabs}><span className={css.activeTab}>{copy.aboutPortfolio}</span></div>
    <div className={styles.detailGrid}><main className={css.mainFields}>
      <OrganizationMarkdownField label={copy.description} value={description} placeholder={copy.descriptionPlaceholder}
        editing={editingDescription} disabled={pending} onEdit={() => setEditingDescription(true)}
        onClose={() => setEditingDescription(false)} onChange={setDescription} />
      <OrganizationExtras target={current ? { workspaceId, targetType: "portfolio", targetId: current.id } : undefined}
        canReadAttachments={canReadAttachments} canManageAttachments={canManageAttachments && current?.status !== "archived"}
        items={checklist} pending={pending} onChange={setChecklist} />
      {!current && <p className={css.note}>{copy.addLater}</p>}
      {error && <FormError message={formatTmsMutationFailure(error, copy.saveError)} />}
    </main><aside className={`${styles.sidebar} ${css.properties}`} aria-label={copy.properties}>
      <div className={css.property}><span>{organizationCopy(locale).phase}</span><WorkflowSelect value={workflowPhase} disabled={pending} onChange={setWorkflowPhase} /></div>
      <div className={css.property}><span>{copy.responsible}</span><ResponsiblePicker workspaceId={workspaceId} value={responsibleIdentityId}
        onChange={setResponsibleIdentityId} disabled={pending} /></div>
    </aside></div>
  </form>;
}
