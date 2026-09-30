import { Archive, ArchiveRestore, Pencil, ChevronUp } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Project } from "../../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { useProjectSettingsEditor } from "../../../projects/state/settings/useProjectSettingsEditor";
import { ProjectKeyHelp } from "../../../projects/presentation/key/ProjectKeyHelp";
import { useDisclosureMotion } from "../../common/disclosure/useDisclosureMotion";
import { ProjectInlineEditor } from "../general/ProjectInlineEditor";
import StatusMark from "../general/status/StatusMark";
import { settingsCopy } from "../navigation/settings-sections";
import css from "../general/general.module.css";

export function ProjectSettings({ project, workspaceId, offline, canManage, onUpdated, onToggle }: {
  project: Project; workspaceId: string; offline: boolean; canManage: boolean;
  onUpdated: (project: Project, etag: string | null) => void; onToggle: () => void;
}) {
  const { t, locale } = useTmsLocale(); const ru = locale === "ru";
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
      <div className={css.identityCopy}>
        <h3>{project.name}</h3>
        <div className={css.metadata}><span className={css.projectKey}><code>{project.key}</code>
          <ProjectKeyHelp id={`${id}-key-help`} value={project.key} locked /></span>
          <span className={css.state} data-archived={archived}>{t(archived ? "common.archived" : "common.active")}</span></div>
      </div>
      <div className={css.headerActions}>
        {(editor.loading || pending || saved) && <StatusMark status={editor.loading || pending ? "running" : "done"}
          label={editor.loading ? (ru ? "Загрузка…" : "Loading…") : pending ? (ru ? "Сохранение…" : "Saving…") : (ru ? "Сохранено" : "Saved")} />}
        {canManage && <button ref={trigger} type="button" className={css.edit} disabled={offline || pending || (!requested && expansion.present)}
          aria-expanded={open} aria-controls={`${id}-editor`} onClick={requested ? cancel : edit}>
          {requested ? <ChevronUp size={15} /> : <Pencil size={15} />}{requested ? (ru ? "Свернуть" : "Collapse") : t("common.edit")}</button>}
      </div>
    </header>
    {project.description && <p className={css.description}>{project.description}</p>}
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
        {archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}{t(archived ? "common.restore" : "common.archive")}</button>}
    </section>
  </div>;
}
