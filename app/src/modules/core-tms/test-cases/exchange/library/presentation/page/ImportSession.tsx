import { useEffect, useMemo, useState } from "react";
import type { Project } from "../../../../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import { useTmsHttpClient } from "../../../../../auth/http/TmsHttpClientContext";
import { useAttachmentClient } from "../../../../../attachments/presentation/context/AttachmentClientProvider";
import { createImportSourceSaver } from "../../application/save-import-source";
import { useImportCases } from "../../../state/import/use-import-cases";
import { ImportHistory } from "../history/ImportHistory";
import { ImportComposer } from "../upload/ImportComposer";
import { ImportProgress } from "../upload/ImportProgress";
import type { ImportCasesPageProps } from "./ImportCasesPage";
import css from "./import-page.module.css";

export function ImportSession(props: ImportCasesPageProps & { projects: readonly Project[]; onRestart: () => void }) {
  const { locale } = useTmsLocale(); const ru = locale === "ru";
  const http = useTmsHttpClient(); const client = useAttachmentClient();
  const [revision, setRevision] = useState(0);
  const saveSource = useMemo(() => createImportSourceSaver(http, client, () => setRevision(value => value + 1)), [http, client]);
  const state = useImportCases({ ...props, locale, saveSource });
  useEffect(() => {
    if (!state.busy) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [state.busy]);
  return <>
    {props.canManage ? <>
      <ImportComposer state={state} projects={props.projects} projectId={props.project.id} onProjectChange={props.onProjectChange} ru={ru} />
      <ImportProgress state={state} ru={ru} />
      {state.locked && !state.busy && <button type="button" className={css.link} onClick={props.onRestart}>{ru ? "Выбрать другой файл" : "Choose another file"}</button>}
    </> : <p className={css.message}>{ru ? "Вы можете просматривать и скачивать файлы. Для импорта нужен доступ к редактированию кейсов." : "You can view and download files. Import requires permission to manage test cases."}</p>}
    <ImportHistory key={`${props.workspaceId}:${props.project.id}`} scope={{ workspaceId: props.workspaceId, projectId: props.project.id }} revision={revision} canManage={props.canManage} />
  </>;
}
