import { Button } from "@heroui/react";
import { ChevronLeft, History } from "lucide-react";
import { useCallback, useState } from "react";
import type { Project } from "../../../../../../../core/tms/contracts/legacy-contract";
import { ErrorToast } from "../../../../../presentation/common/error/ErrorToast";
import { LoadingOrb } from "../../../../../../../shared/components/loading/LoadingOrb";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import { useImportProjects } from "../../../state/project/useImportProjects";
import { ExportCasesAction } from "../export/ExportCasesAction";
import { ImportHistoryPage } from "../history/ImportHistoryPage";
import { ImportSession } from "./ImportSession";
import type { ImportFile } from "../../model/import-file";
import css from "./import-page.module.css";

export type ImportCasesPageProps = Readonly<{
  project: Project; workspaceId: string; canManage: boolean; exportEnabled: boolean; initialFolderId?: string | null;
  onBack: () => void;
  onImported: (projectId?: string) => Promise<unknown>;
}>;
export function ImportCasesPage(props: ImportCasesPageProps) {
  const { locale } = useTmsLocale(); const ru = locale === "ru";
  const catalog = useImportProjects(props.project, props.workspaceId);
  const [session, setSession] = useState(0);
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const [historyProjectId, setHistoryProjectId] = useState(props.project.id);
  const sourceSaved = useCallback((receipt: ImportFile) => { setRevision(value => value + 1); setHistoryProjectId(receipt.projectId); }, []);
  const [history, setHistory] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("importFile"));
  return <main className={css.page} data-import-page>
    <div className={css.content}>
      <Button className={css.back} size="sm" variant="light" radius="full" isDisabled={busy}
        onPress={history ? () => setHistory(false) : props.onBack} startContent={<ChevronLeft size={16} aria-hidden="true" />}>
        {history ? (ru ? "Импорт и экспорт" : "Import and export") : (ru ? "Настройки" : "Settings")}</Button>
      <header className={css.pageHeader}><div><h1>{history ? (ru ? "История файлов" : "File history") : (ru ? "Импорт и экспорт" : "Import and export")}</h1></div>
        <div className={css.headerActions}>{catalog.project && <ExportCasesAction project={catalog.project}
          projects={catalog.catalog?.projects ?? []} enabled={props.exportEnabled} disabled={busy} />}
          <Button isIconOnly radius="full" variant="light" className={css.historyButton} isDisabled={!catalog.project || busy}
            aria-label={ru ? "История файлов" : "File history"} aria-pressed={history} title={ru ? "История файлов" : "File history"}
            onPress={() => setHistory(value => !value)}><History size={20} strokeWidth={1.7} aria-hidden="true" /></Button></div>
      </header>
      {!catalog.catalog ? catalog.error ? <><ErrorToast message={ru ? "Не удалось загрузить проекты." : "Could not load projects."} />
        <Button variant="light" radius="full" className={css.quiet} onPress={catalog.retry}>{ru ? "Загрузить проекты" : "Load projects"}</Button></>
        : <p className={css.message} role="status"><LoadingOrb size="md" />{ru ? "Загружаем проекты…" : "Loading projects…"}</p>
        : !catalog.project ? <p className={css.message}>{ru ? "Текущий проект недоступен. Выберите проект в хедере рабочего пространства." : "The current project is unavailable. Choose a project in the workspace header."}</p>
        : <><div className={css.session} hidden={history}><ImportSession key={`${props.workspaceId}:${catalog.project.id}:${session}`} {...props} project={catalog.project}
          projects={catalog.catalog.projects} onRestart={() => setSession(value => value + 1)} onBusyChange={setBusy}
          onHistoryChange={sourceSaved} /></div>
          {history && <ImportHistoryPage workspaceId={props.workspaceId} projects={catalog.catalog.projects}
            initialProjectId={historyProjectId} revision={revision} canManage={props.canManage} />}</>}
    </div>
  </main>;
}
