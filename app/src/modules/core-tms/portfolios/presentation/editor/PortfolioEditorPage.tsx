import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { OrganizationExtras } from "../../management/presentation/extras/OrganizationExtras";
import { WorkflowSelect } from "../../management/presentation/WorkflowSelect";
import { organizationCopy } from "../../management/model/copy";
import { organizationErrors, focusOrganizationError } from "./validation/validate";
import { EditorActions } from "./actions/EditorActions";
import { useId, useState } from "react";
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

export function PortfolioEditorPage({ actionsTargetId, workspaceId, canReadAttachments = false, canManageAttachments = false, current, copy, pending, error, onSave, onCancel }: {
  actionsTargetId?: string; workspaceId: string; canReadAttachments?: boolean; canManageAttachments?: boolean; current?: Portfolio; copy: PortfolioCopy; pending: boolean; error: TmsMutationFailure | null;
  onSave: (draft: PortfolioDraft) => Promise<void>; onCancel: () => void;
}) {
  const { locale } = useTmsLocale();
  const formId = useId();
  const [attempted, setAttempted] = useState(false);
  const [workflowPhase, setWorkflowPhase] = useState(current?.workflowPhase ?? "new");
  const [checklistDraft, setChecklist] = useState(current?.checklist ?? []);
  const checklist = checklistDraft ?? [];
  const [editingDescription, setEditingDescription] = useState(false);
  const [name, setName] = useState(current?.name ?? "");
  const [description, setDescription] = useState(current?.description ?? "");
  const [responsibleIdentityId, setResponsibleIdentityId] = useState(current?.responsibleIdentityId ?? null);
  const errors = organizationErrors({ name, description, checklist }, locale === "ru");
  return <form id={formId} noValidate className={`${css.editor} ${css.portfolioEditor}`} onSubmit={(event) => { event.preventDefault(); setAttempted(true); if (pending) return; if (Object.keys(errors).length) { focusOrganizationError(event.currentTarget, errors); return; } void onSave({ name, description, responsibleIdentityId, workflowPhase, checklist }); }} aria-busy={pending || undefined}>
    <header className={styles.heading}>
      <PiBriefcaseDuotone size={24} className={styles.portfolioIcon} aria-hidden="true" />
      <div className={css.titleField}><label className={styles.srOnly} htmlFor="portfolio-title">{copy.portfolioTitle}</label>
        <input id="portfolio-title" autoFocus required data-field="name" aria-invalid={attempted && Boolean(errors.name)} aria-describedby={attempted && errors.name ? `${formId}-name-error` : undefined} maxLength={120} disabled={pending} value={name} onChange={(event) => setName(event.target.value)} placeholder={copy.portfolioTitle} />
      {attempted && errors.name && <span id={`${formId}-name-error`} className={css.limit} role="alert">{errors.name}</span>}</div>
      <EditorActions targetId={actionsTargetId} formId={formId} pending={pending} saveLabel={current ? copy.save : copy.createPortfolio} cancelLabel={copy.cancel} onCancel={onCancel} />
    </header>
    <div className={styles.tabs}><span className={css.activeTab}>{copy.aboutPortfolio}</span></div>
    <div className={css.editorBody}><main className={css.mainFields}>
      <OrganizationMarkdownField label={copy.description} value={description} placeholder={copy.descriptionPlaceholder}
        editing={editingDescription} disabled={pending} onEdit={() => setEditingDescription(true)}
        onClose={() => setEditingDescription(false)} onChange={setDescription} />
      <OrganizationExtras target={current ? { workspaceId, targetType: "portfolio", targetId: current.id } : undefined}
        canReadAttachments={canReadAttachments} canManageAttachments={canManageAttachments && current?.status !== "archived"}
        items={checklist} pending={pending} onChange={setChecklist} />
      {!current && <p className={css.note}>{copy.addLater}</p>}
      {error && <FormError message={formatTmsMutationFailure(error, copy.saveError)} />}
      {attempted && errors.checklist && <p data-field="checklist" tabIndex={-1} className={css.limit} role="alert">{errors.checklist}</p>}
    </main><aside className={css.properties} aria-label={copy.properties}>
      <div className={css.property}><span>{organizationCopy(locale).phase}</span><WorkflowSelect value={workflowPhase} disabled={pending} onChange={setWorkflowPhase} /></div>
      <div className={css.property}><span>{copy.responsible}</span><ResponsiblePicker workspaceId={workspaceId} value={responsibleIdentityId}
        onChange={setResponsibleIdentityId} disabled={pending} /></div>
    </aside></div>
  </form>;
}
