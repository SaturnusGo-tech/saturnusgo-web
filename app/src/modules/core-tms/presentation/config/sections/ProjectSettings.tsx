import { Archive, ArrowRotateCcw, EditPencil, ChevronUp } from "@openai/apps-sdk-ui/components/Icon";
import { useEffect, useId, useRef, useState } from "react";
import type { Project } from "../../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { useProjectSettingsEditor } from "../../../projects/state/settings/useProjectSettingsEditor";
import { ProjectKeyHelp } from "../../../projects/presentation/key/ProjectKeyHelp";
import { useDisclosureMotion } from "../../common/disclosure/useDisclosureMotion";
import { ProjectInlineEditor } from "../general/ProjectInlineEditor";
import StatusMark from "../general/status/StatusMark";
import { settingsCopy } from "../navigation/settings-sections";
import { portfolioCopy } from "../../../portfolios/model/copy";
import { ResponsibleName } from "../../../workspace/members/presentation/ResponsibleName";
import { PortfolioName } from "../general/properties/PortfolioName";
import css from "../general/general.module.css";

export function ProjectSettings({ project, workspaceId, offline, canManage, onUpdated, onToggle }: {
  project: Project; workspaceId: string; offline: boolean; canManage: boolean;
  onUpdated: (project: Project, etag: string | null) => void; onToggle: () => void;
}) {
  const { t, locale } = useTmsLocale(); const ru = locale === "ru";
  const copy = portfolioCopy(locale);
  const [requested, setRequested] = useState(false);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const id = useId(); const archived = project.status === "archived";
  const editor = useProjectSettingsEditor({ projectId: project.id, enabled: canManage, offline,
    errorText: ru ? "Не удалось загрузить проект. Повторите попытку." : "Could not load the project. Try again." });
  const open = requested && Boolean(editor.resource) && canManage && !offline;
  const expansion = useDisclosureMotion(open, true, { overflow: "visible" });
  useEffect(() => {
    if (!requested && !expansion.present) {
      editor.close();
      if (restoreFocus.current) { restoreFocus.current = false; trigger.current?.focus({ preventScroll: true }); }
    }
  }, [requested, expansion.present, editor.close]);
  useEffect(() => { if (!canManage || offline) { setRequested(false); setPending(false); } }, [canManage, offline]);
  function cancel() {
    if (pending) return;
    restoreFocus.current = true;
    setRequested(false);
    if (!expansion.present) editor.close();
  }
  function edit() {
    if (!canManage || offline || pending) return;
    setSaved(false); setRequested(true); void editor.load();
  }
  return <div className={css.general} data-testid="project-general">
    <header className={css.identity}>
      <h3>{copy.properties}</h3>
      <div className={css.headerActions}>
        {(editor.loading || pending || saved) && <StatusMark status={editor.loading || pending ? "running" : "done"}
          label={editor.loading ? (ru ? "Загрузка…" : "Loading…") : pending ? (ru ? "Сохранение…" : "Saving…") : (ru ? "Сохранено" : "Saved")} />}
        {canManage && <button ref={trigger} type="button" className={css.edit} disabled={offline || pending || (!requested && expansion.present)}
          aria-expanded={open} aria-controls={`${id}-editor`} onClick={requested ? cancel : edit}>
          {requested ? <ChevronUp width={15} height={15} /> : <EditPencil width={15} height={15} />}{requested ? (ru ? "Свернуть" : "Collapse") : t("common.edit")}</button>}
      </div>
    </header>
    <dl className={css.properties} hidden={open}>
      <div className={css.property}><dt>{copy.name}</dt><dd>{project.name}</dd></div>
      <div className={css.property}><dt>{copy.key}</dt><dd className={css.projectKey}><code>{project.key}</code>
        <ProjectKeyHelp id={`${id}-key-help`} value={project.key} locked /></dd></div>
      <div className={`${css.property} ${css.descriptionProperty}`}><dt>{copy.description}</dt><dd className={css.description} data-empty={!project.description || undefined}>{project.description || copy.noDescription}</dd></div>
      <div className={css.property}><dt>{copy.responsible}</dt><dd><ResponsibleName workspaceId={workspaceId} identityId={project.responsibleIdentityId ?? null} offline={offline} /></dd></div>
      <div className={css.property}><dt>{copy.portfolio}</dt><dd><PortfolioName id={project.portfolioId ?? null} offline={offline} /></dd></div>
      <div className={css.property}><dt>{copy.status}</dt><dd><span className={css.state} data-archived={archived}>{t(archived ? "common.archived" : "common.active")}</span></dd></div>
    </dl>
    {editor.error && <div role="alert" className={css.error}>{editor.error}
      <button type="button" className={css.textAction} onClick={edit}>{ru ? "Повторить" : "Try again"}</button></div>}
    {expansion.present && <div id={`${id}-editor`} data-project-expansion aria-hidden={!open || undefined}
      ref={element => { expansion.ref.current = element; if (element) element.inert = !open; }}>
      <div className={css.editorSpace}>{editor.resource && <ProjectInlineEditor workspaceId={workspaceId}
        project={editor.resource.data} etag={editor.resource.etag} offline={offline || !canManage}
        onBusy={setPending} onCancel={cancel} onSaved={(value, etag) => {
          restoreFocus.current = true;
          onUpdated(value, etag); setPending(false); setSaved(true); setRequested(false);
        }} />}</div>
    </div>}
    <section className={css.archive}>
      <div><h4>{t(archived ? "common.restore" : "common.archive")}</h4>
        <p>{settingsCopy[locale].archiveHint}</p></div>
      {canManage && <button type="button" className={css.edit} disabled={offline || pending || requested || expansion.present} onClick={onToggle}>
        {archived ? <ArrowRotateCcw width={15} height={15} /> : <Archive width={15} height={15} />}{t(archived ? "common.restore" : "common.archive")}</button>}
    </section>
  </div>;
}
