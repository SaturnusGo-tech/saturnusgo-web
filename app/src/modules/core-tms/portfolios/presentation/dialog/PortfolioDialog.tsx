import { useState } from "react";
import { PiBriefcaseLight, PiInfo, PiSpinnerGap } from "react-icons/pi";
import type { TmsMutationFailure } from "../../../../../core/tms/errors/mutation-failure";
import { formatTmsMutationFailure } from "../../../../../core/tms/errors/mutation-failure";
import { Modal } from "../../../presentation/common/modal/Modal";
import { FormError } from "../../../presentation/common/error/FormError";
import { ResponsiblePicker } from "../../../workspace/members/presentation/ResponsiblePicker";
import type { Portfolio, PortfolioDraft } from "../../model/portfolio";
import type { PortfolioCopy } from "../../model/copy";
import styles from "../styles/dialog.module.css";

export function PortfolioDialog({ workspaceId, current, copy, pending, error, onSave, onClose }: {
  workspaceId: string; current?: Portfolio; copy: PortfolioCopy; pending: boolean; error: TmsMutationFailure | null;
  onSave: (draft: PortfolioDraft) => Promise<void>; onClose: () => void;
}) {
  const [name, setName] = useState(current?.name ?? "");
  const [description, setDescription] = useState(current?.description ?? "");
  const [responsibleIdentityId, setResponsibleIdentityId] = useState(current?.responsibleIdentityId ?? null);
  const modified = !current || name.trim() !== current.name || description.trim() !== current.description || responsibleIdentityId !== current.responsibleIdentityId;
  return <Modal title={current ? copy.editPortfolio : copy.newPortfolio} onClose={onClose} panelClassName={styles.panel}>
    <form className={styles.form} onSubmit={(event) => { event.preventDefault(); void onSave({ name, description, responsibleIdentityId }); }} aria-busy={pending || undefined}>
      <div className={styles.body}>
        <p className={styles.intro}><PiBriefcaseLight size={24} aria-hidden="true" />{copy.portfolioHint}</p>
        <label className={styles.field}><span>{copy.name}</span><input required autoFocus data-autofocus maxLength={120} disabled={pending}
          value={name} onChange={(event) => setName(event.target.value)} placeholder={copy.portfolioName} /></label>
        <label className={styles.field}><span>{copy.description}<small>{copy.optional}</small></span><textarea maxLength={20000} rows={3} disabled={pending}
          value={description} onChange={(event) => setDescription(event.target.value)} placeholder={copy.portfolioDescription} /></label>
        <div className={styles.field}><span>{copy.responsible}<small>{copy.optional}</small></span>
          <ResponsiblePicker workspaceId={workspaceId} value={responsibleIdentityId} onChange={setResponsibleIdentityId} disabled={pending} />
        </div>
        {!current && <p className={styles.note}><PiInfo size={18} aria-hidden="true" />{copy.addLater}</p>}
        {error && <FormError message={formatTmsMutationFailure(error, copy.saveError)} />}
      </div>
      <footer className={styles.footer}><button type="button" onClick={onClose}>{copy.cancel}</button>
        <button className={styles.primary} disabled={pending || !name.trim() || !modified}>
          {pending && <PiSpinnerGap className={styles.spin} aria-hidden="true" />}{pending ? copy.saving : current ? copy.save : copy.createPortfolio}
        </button>
      </footer>
    </form>
  </Modal>;
}
