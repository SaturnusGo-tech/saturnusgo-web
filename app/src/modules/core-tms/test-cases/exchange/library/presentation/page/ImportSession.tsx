import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { Project } from "../../../../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import { useTmsHttpClient } from "../../../../../auth/http/TmsHttpClientContext";
import { useAttachmentClient } from "../../../../../attachments/presentation/context/AttachmentClientProvider";
import { useLoadingFeedback } from "../../../../../presentation/common/loading/feedback/useLoadingFeedback";
import { createImportSourceSaver } from "../../application/save-import-source";
import { useImportCases } from "../../../state/import/use-import-cases";
import { ImportComposer } from "../upload/ImportComposer";
import { ImportProgress } from "../upload/ImportProgress";
import { ImportReview } from "../review/ImportReview";
import { ImportDestination } from "../destination/ImportDestination";
import { ImportCodexHint } from "../codex/ImportCodexHint";
import type { ImportCasesPageProps } from "./ImportCasesPage";
import type { ImportFile } from "../../model/import-file";
import css from "./import-page.module.css";

export function ImportSession(props: ImportCasesPageProps & { projects: readonly Project[]; onRestart: () => void;
  onBusyChange: (busy: boolean) => void; onHistoryChange: (receipt: ImportFile) => void }) {
  const { locale } = useTmsLocale(); const ru = locale === "ru";
  const http = useTmsHttpClient(); const client = useAttachmentClient();
  const [destination, setDestination] = useState(false);
  const saveSource = useMemo(() => createImportSourceSaver(http, client, props.onHistoryChange), [http, client, props.onHistoryChange]);
  const state = useImportCases({ ...props, locale, saveSource });
  const pending = state.preparing || state.committing;
  const feedback = useLoadingFeedback(pending);
  const covered = pending || feedback;
  const reduced = useReducedMotion();
  const step = covered ? "preparing" : !state.document ? "file" : destination && !state.locked ? "destination" : "review";
  useEffect(() => { props.onBusyChange(covered); return () => props.onBusyChange(false); }, [covered, props.onBusyChange]);
  useEffect(() => {
    if (!state.busy) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [state.busy]);
  if (!props.canManage) return <p className={css.message}>{ru
    ? "Вы можете просматривать и скачивать файлы. Для импорта нужен доступ к редактированию кейсов."
    : "You can view and download files. Import requires permission to manage test cases."}</p>;
  return <div className={css.workflow}>
    <AnimatePresence initial={false} mode="wait"><motion.div key={step} className={css.stage}
      initial={{ opacity: 0, filter: reduced ? "none" : "blur(3px)" }} animate={{ opacity: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .2 }}>
      {covered ? <ImportProgress state={state} ru={ru} visible={feedback} />
        : step === "file" ? <ImportComposer state={state} ru={ru} />
        : step === "destination" ? <ImportDestination state={state} projects={props.projects} ru={ru} onBack={() => setDestination(false)} />
        : <ImportReview state={state} ru={ru} preparationProject={props.project.name} onContinue={() => setDestination(true)} onRestart={props.onRestart} />}
    </motion.div></AnimatePresence>
    {!state.document && !covered && <div className={css.codex}><ImportCodexHint workspaceId={props.workspaceId} projectId={props.project.id}
      canManage={props.canManage} busy={state.busy} /></div>}
  </div>;
}
