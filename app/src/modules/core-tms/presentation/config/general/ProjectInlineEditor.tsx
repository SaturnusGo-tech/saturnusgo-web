import { useEffect, useRef } from "react";
import type { Project } from "../../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { portfolioCopy } from "../../../portfolios/model/copy";
import { useProjectForm } from "../../../projects/state/dialog/useProjectForm";
import { useProjectPortfolioOptions } from "../../../projects/state/dialog/useProjectPortfolioOptions";
import { ResponsiblePicker } from "../../../workspace/members/presentation/ResponsiblePicker";
import { AnimatedSelect } from "../../common/select/AnimatedSelect";
import { getProjectDialogCopy } from "../../dialogs/project/copy";
import css from "./general.module.css";

export function ProjectInlineEditor({ project, etag, workspaceId, offline, onBusy, onCancel, onSaved }: {
  project: Project; etag: string | null; workspaceId: string; offline: boolean;
  onBusy: (busy: boolean) => void; onCancel: () => void; onSaved: (project: Project, etag: string | null) => void;
}) {
  const { locale } = useTmsLocale(); const ru = locale === "ru";
  const copy = getProjectDialogCopy(locale); const catalog = portfolioCopy(locale);
  const form = useProjectForm({ workspaceId, project, projectEtag: etag, offline, errorText: copy.projectError });
  const portfolios = useProjectPortfolioOptions(workspaceId, !offline);
  const name = useRef<HTMLInputElement>(null);
  useEffect(() => { name.current?.focus({ preventScroll: true }); }, []);
  useEffect(() => { onBusy(form.pending); }, [form.pending, onBusy]);
  const options = [{ value: "", label: catalog.noPortfolio }, ...portfolios.items.map(item => ({ value: item.id, label: item.name }))];
  if (form.portfolioId && !portfolios.items.some(item => item.id === form.portfolioId)) options.push({ value: form.portfolioId, label: catalog.unknownPortfolio });
  const disabled = offline || form.pending || !etag;
  return <form className={css.form} aria-label={copy.editTitle} aria-busy={form.pending || undefined}
    onKeyDown={event => { if (event.key === "Escape" && !form.pending) { event.preventDefault(); event.stopPropagation(); onCancel(); } }}
    onSubmit={async event => {
      event.preventDefault();
      if (disabled || !form.modified || !form.name.trim()) return;
      const result = await form.save();
      if (result) onSaved(result.data, result.etag);
    }}>
    <label className={`${css.field} ${css.full}`}><span>{copy.name}</span>
      <input ref={name} required maxLength={120} disabled={disabled} value={form.name}
        onChange={event => form.updateName(event.target.value)} placeholder={copy.namePlaceholder} data-testid="project-name" /></label>
    <label className={`${css.field} ${css.full}`}><span>{copy.description}<small>{copy.optional}</small></span>
      <textarea rows={2} maxLength={20000} disabled={disabled} value={form.description} onChange={event => form.setDescription(event.target.value)} placeholder={copy.descriptionPlaceholder} /></label>
    <div className={`${css.field} ${css.selectField}`}><span>{catalog.portfolio}</span>
      <AnimatedSelect label={catalog.portfolio} value={form.portfolioId ?? ""} options={options} disabled={disabled}
        onChange={value => form.setPortfolioId(value || null)} />
      {portfolios.loading && <small role="status" className={css.srOnly}>{catalog.loading}</small>}
      {portfolios.error && <button type="button" className={css.textAction} onClick={portfolios.retry}>{catalog.optionsError} {catalog.retry}</button>}
      {portfolios.cursor && <button type="button" className={css.textAction} disabled={portfolios.loading} onClick={portfolios.more}>{catalog.portfolioMore}</button>}
    </div>
    <div className={`${css.field} ${css.selectField}`}><span>{catalog.responsible}</span>
      <ResponsiblePicker workspaceId={workspaceId} value={form.responsibleIdentityId} onChange={form.setResponsibleIdentityId} disabled={disabled} offline={offline} />
    </div>
    {form.error && <p className={`${css.error} ${css.full}`} role="alert">{form.error}</p>}
    {!etag && <p className={`${css.error} ${css.full}`} role="alert">{ru ? "Не удалось получить версию проекта. Закройте форму и повторите попытку." : "Could not load the project version. Close the form and try again."}</p>}
    <footer className={`${css.actions} ${css.full}`}>
      <button type="button" className={css.cancel} disabled={form.pending} onClick={onCancel}>{copy.cancel}</button>
      <button className={css.save} disabled={disabled || !form.modified || !form.name.trim()}>{form.pending ? copy.saving : copy.save}</button>
    </footer>
  </form>;
}
