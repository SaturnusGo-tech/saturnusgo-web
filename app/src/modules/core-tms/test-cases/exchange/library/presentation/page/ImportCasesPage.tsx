import { ErrorToast } from "../../../../../presentation/common/error/ErrorToast";
import { LoadingOrb } from "../../../../../../../shared/components/loading/LoadingOrb";
import { ChevronLeft } from "lucide-react";
import { useState } from "react";
import type { Project } from "../../../../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import { useImportProjects } from "../../../state/project/useImportProjects";
import { ExportCasesAction } from "../export/ExportCasesAction";
import { ImportSession } from "./ImportSession";
import css from "./import-page.module.css";

export type ImportCasesPageProps = Readonly<{
  project: Project; workspaceId: string; canManage: boolean; exportEnabled: boolean; initialFolderId?: string | null;
  onBack: () => void;
  onProjectChange: (id: string) => void; onImported: () => Promise<unknown>;
}>;
export function ImportCasesPage(props: ImportCasesPageProps) {
  const { locale } = useTmsLocale(); const ru = locale === "ru";
  const catalog = useImportProjects(props.project, props.workspaceId);
  const [session, setSession] = useState(0);
  return <main className={css.page} data-import-page>
    <div className={css.content}>
      <button className={css.back} type="button" onClick={props.onBack}><ChevronLeft size={16} aria-hidden="true" />{ru ? "Настройки" : "Settings"}</button>
      <header className={css.pageHeader}><div><h1>{ru ? "Импорт и экспорт" : "Import and export"}</h1>
        <p>{ru ? "Добавьте JSON-файл и выберите, куда перенести кейсы." : "Add a JSON file and choose where to import your test cases."}</p></div>
        {catalog.project && <ExportCasesAction key={catalog.project.id} project={catalog.project} enabled={props.exportEnabled} />}
      </header>
      {!catalog.catalog ? catalog.error ? <ErrorToast message={ru ? "Не удалось загрузить проекты." : "Could not load projects."}
        retryLabel={ru ? "Повторить" : "Retry"} onRetry={catalog.retry} />
        : <p className={css.message} role="status"><LoadingOrb size="md" />{ru ? "Загружаем проекты…" : "Loading projects…"}</p>
        : !catalog.project ? <p className={css.empty}>{ru ? "Нет доступных проектов для импорта." : "No projects available for import."}</p>
        : <div className={css.session}><ImportSession key={`${props.workspaceId}:${catalog.project.id}:${session}`} {...props} project={catalog.project}
          projects={catalog.catalog.projects} onRestart={() => setSession(value => value + 1)} /></div>}
    </div>
  </main>;
}
