import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import type { Project } from "../../../../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import { useImportProjects } from "../../../state/project/useImportProjects";
import { ImportSession } from "./ImportSession";
import css from "./import-page.module.css";

export type ImportCasesPageProps = Readonly<{
  project: Project; workspaceId: string; canManage: boolean; initialFolderId?: string | null;
  onProjectChange: (id: string) => void; onImported: () => Promise<unknown>;
}>;
export function ImportCasesPage(props: ImportCasesPageProps) {
  const { locale } = useTmsLocale(); const ru = locale === "ru";
  const catalog = useImportProjects(props.project, props.workspaceId);
  const [session, setSession] = useState(0);
  return <main className={css.page} data-import-page>
    <div className={css.content}>
      <h1>{ru ? "Импорт тест-кейсов" : "Import test cases"}</h1>
      {!catalog.catalog ? catalog.error ? <p className={css.error} role="alert">{ru ? "Не удалось загрузить проекты." : "Could not load projects."} <button type="button" onClick={catalog.retry}>{ru ? "Повторить" : "Retry"}</button></p>
        : <p className={css.message} role="status"><LoaderCircle size={18} className={css.spin} />{ru ? "Загружаем проекты…" : "Loading projects…"}</p>
        : !catalog.project ? <p className={css.empty}>{ru ? "Нет доступных проектов для импорта." : "No projects available for import."}</p>
        : <div className={css.session}><ImportSession key={`${props.workspaceId}:${catalog.project.id}:${session}`} {...props} project={catalog.project}
          projects={catalog.catalog.projects} onRestart={() => setSession(value => value + 1)} /></div>}
    </div>
  </main>;
}
