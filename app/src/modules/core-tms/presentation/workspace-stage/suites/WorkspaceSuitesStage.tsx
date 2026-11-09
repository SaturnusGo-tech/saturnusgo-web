import { useEffect, useRef } from "react";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import type { WorkspaceModel } from "../../../state/model/useWorkspaceModel";
import { SuiteDialog } from "../../dialogs/suite/SuiteDialog";
import { SuitesView } from "../../suites/SuitesView";
import { useSuiteEditorRoute } from "./useSuiteEditorRoute";
import css from "../../dialogs/suite/suite-dialog.module.css";
import shared from "../../suites/suites.module.css";

export function WorkspaceSuitesStage({ model }: { model: WorkspaceModel }) {
  const { t, locale } = useTmsLocale(); const project = model.project!;
  const route = useSuiteEditorRoute(model.data.workspace.id, project.id);
  const canManage = model.data.meta.authorization.capabilities.includes("suite:manage");
  const detail = model.selectedSuiteDetail?.id === route.id ? model.selectedSuiteDetail : null;
  const editing = Boolean(route.mode && canManage && !(route.mode === "edit" && detail?.status === "archived"));
  const catalog = useRef<HTMLDivElement>(null); const previous = useRef(editing);
  useEffect(() => {
    if (previous.current && !editing) catalog.current?.querySelector<HTMLElement>("h1")?.focus();
    previous.current = editing;
  }, [editing]);
  const view = <div ref={catalog} hidden={editing} style={{ flex: 1, height: "100%", minHeight: 0, minWidth: 0, display: editing ? "none" : "flex" }}>
    <SuitesView workspaceId={model.data.workspace.id} projectId={project.id} projectName={project.name}
      suites={model.projectSuites} cases={model.projectCases} folders={model.folders.items}
      selectedDetail={model.selectedSuite} detailError={model.selectedSuiteDetailError} onRetryDetail={model.retrySelectedSuiteDetail}
      canManage={canManage} canRun={model.data.meta.authorization.capabilities.includes("run:manage")}
      onSelect={model.setSelectedSuiteId} onCreate={() => route.open(null)}
      onConfigure={id => { model.setSelectedSuiteId(id); route.open(id); }}
      onRun={id => model.openRunDialog({ suiteId: id })}
      onOpenCase={item => { model.setQuery(""); model.setSelectedCaseId(item.id); model.setSelectedFolder(item.folderPath); model.setView("cases"); }} />
  </div>;
  if (!editing) return view;
  if (route.mode === "edit" && !detail) return <>{view}<section className={shared.workspace}><div className={css.page}>
    <button className={css.cancel} onClick={route.close}>{locale === "ru" ? "Назад к набору" : "Back to suite"}</button>
    <p role={model.selectedSuiteDetailError ? "alert" : "status"}>{model.selectedSuiteDetailError
      ? (locale === "ru" ? "Не удалось загрузить набор. Ваши данные не изменены." : "Could not load this suite. Your data has not changed.")
      : (locale === "ru" ? "Загрузка набора…" : "Loading suite…")}</p>
    {model.selectedSuiteDetailError && <button className={css.cancel} onClick={model.retrySelectedSuiteDetail}>{locale === "ru" ? "Повторить" : "Retry"}</button>}
  </div></section></>;
  return <>{view}<SuiteDialog key={route.mode === "edit" ? route.id : "new"} projectId={project.id} projectName={project.name}
    cases={model.projectCases} folders={model.folders.items} suite={route.mode === "edit" ? detail ?? undefined : undefined}
    suiteEtag={route.mode === "edit" ? model.selectedSuiteEtag : null} offline={model.connection === "demo"} onClose={route.close}
    onSaved={(suite, etag) => {
      const existing = model.data.suites.some(item => item.id === suite.id);
      const { caseIds: _ids, filter: _filter, resolvedCaseCount: _resolved, ...summary } = suite;
      model.setData(current => ({ ...current, suites: current.suites.some(item => item.id === suite.id)
        ? current.suites.map(item => item.id === suite.id ? summary : item) : [...current.suites, summary] }));
      model.setSelectedSuiteId(suite.id); model.setSelectedSuiteDetail(suite); model.setSelectedSuiteEtag(etag);
      route.show(suite.id); model.notify(t(existing ? "actions.suiteUpdated" : "actions.suiteCreated"));
    }} /></>;
}
