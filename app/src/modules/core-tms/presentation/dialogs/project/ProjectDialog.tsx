import { PiInfo, PiLockKey, PiPlus, PiSpinnerGap } from "react-icons/pi";
import type { Project } from "../../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { portfolioCopy } from "../../../portfolios/model/copy";
import { useProjectForm } from "../../../projects/state/dialog/useProjectForm";
import { useProjectPortfolioOptions } from "../../../projects/state/dialog/useProjectPortfolioOptions";
import { ResponsiblePicker } from "../../../workspace/members/presentation/ResponsiblePicker";
import { FormError } from "../../common/error/FormError";
import { Modal } from "../../common/modal/Modal";
import { AnimatedSelect } from "../../common/select/AnimatedSelect";
import { getProjectDialogCopy } from "./copy";
import styles from "./projectDialog.module.css";

export function ProjectDialog({ workspaceId, project, projectEtag, portfolioId, portfolioName, offline, onClose, onCreated, onUpdated }: {
  workspaceId: string; project?: Project; projectEtag?: string | null; portfolioId?: string | null; portfolioName?: string;
  offline: boolean; onClose: () => void; onCreated: (project: Project) => void; onUpdated: (project: Project, etag: string | null) => void;
}) {
  const { locale } = useTmsLocale();
  const copy = getProjectDialogCopy(locale);
  const catalogCopy = portfolioCopy(locale);
  const form = useProjectForm({ workspaceId, project, projectEtag, offline, portfolioId, errorText: copy.projectError });
  const portfolios = useProjectPortfolioOptions(workspaceId, !offline);
  const options = [{ value: "", label: catalogCopy.noPortfolio }, ...portfolios.items.map((item) => ({ value: item.id, label: item.name }))];
  if (form.portfolioId && !portfolios.items.some((item) => item.id === form.portfolioId)) {
    options.push({ value: form.portfolioId, label: portfolioName || catalogCopy.unknownPortfolio });
  }
  return <Modal title={project ? copy.editTitle : copy.title} onClose={onClose} panelClassName={styles.panel}>
    <form className={styles.form} onSubmit={async (event) => {
      event.preventDefault();
      const result = await form.save();
      if (result) { if (project) onUpdated(result.data, result.etag); else onCreated(result.data); }
    }} aria-busy={form.pending || undefined}>
      <div className={styles.body}>
        <p className={styles.intro}>{project ? copy.editHint : copy.createHint}</p>
        <div className={project ? styles.editFields : styles.identityFields}>
          <label className={styles.field}><span>{copy.name}</span>
            <input required autoFocus data-autofocus maxLength={120} disabled={form.pending || offline} value={form.name}
              onChange={(event) => form.updateName(event.target.value)} placeholder={copy.namePlaceholder} data-testid="project-name" /></label>
          {!project && <label className={styles.field}><span>{copy.key}</span>
            <input required disabled={form.pending || offline} minLength={2} maxLength={12} pattern="[A-Z][A-Z0-9]{1,11}" value={form.key}
              onChange={(event) => form.setKey(event.target.value.replace(/[^a-z0-9]/gi, "").toUpperCase())}
              placeholder={copy.keyPlaceholder} aria-describedby="project-key-hint" /></label>}
        </div>
        {!project && <p id="project-key-hint" className={styles.hint}>{copy.newKeyHint}<code>{form.key || copy.keyPlaceholder}-TC-1</code></p>}
        <label className={styles.field}><span>{copy.description}<small>{copy.optional}</small></span>
          <textarea disabled={form.pending || offline} maxLength={20000} value={form.description} onChange={(event) => form.setDescription(event.target.value)} placeholder={copy.descriptionPlaceholder} rows={3} /></label>
        <div className={styles.field}><span>{catalogCopy.portfolio}<small>{copy.optional}</small></span>
          <AnimatedSelect label={catalogCopy.portfolio} value={form.portfolioId ?? ""} options={options}
            disabled={form.pending || offline} onChange={(value) => form.setPortfolioId(value || null)} />
          {portfolios.loading && <small role="status">{catalogCopy.loading}</small>}
          {portfolios.error && <button type="button" className={styles.inlineAction} onClick={portfolios.retry}>{catalogCopy.optionsError} {catalogCopy.retry}</button>}
          {portfolios.cursor && <button type="button" className={styles.inlineAction} disabled={portfolios.loading} onClick={portfolios.more}>{catalogCopy.portfolioMore}</button>}
        </div>
        <div className={styles.field}><span>{catalogCopy.responsible}<small>{copy.optional}</small></span>
          <ResponsiblePicker workspaceId={workspaceId} value={form.responsibleIdentityId} onChange={form.setResponsibleIdentityId} disabled={form.pending} offline={offline} />
        </div>
        {project ? <div className={styles.projectKey}>
          <PiLockKey size={18} aria-hidden="true" /><span>{copy.key}<small>{copy.keyHint}</small></span><code>{project.key}</code>
        </div> : <p className={styles.note}><PiInfo size={18} aria-hidden="true" />{copy.environmentHint}</p>}
        {offline && <FormError message={catalogCopy.offline} />}
        {form.error && <FormError message={form.error} />}
      </div>
      <footer className={styles.actions}>
        <button type="button" onClick={onClose}>{copy.cancel}</button>
        <button className={styles.primary} disabled={offline || form.pending || !form.name.trim() || form.key.trim().length < 2 || (!form.modified && !form.error)}>
          {form.pending ? <PiSpinnerGap size={17} className={styles.spin} aria-hidden="true" /> : !project ? <PiPlus size={17} aria-hidden="true" /> : null}
          {form.pending ? project ? copy.saving : copy.creating : project ? copy.save : copy.create}
        </button>
      </footer>
    </form>
  </Modal>;
}
