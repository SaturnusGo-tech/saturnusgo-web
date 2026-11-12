import { Accordion, AccordionItem, Button } from "@heroui/react";
import { ArrowRight, CheckCircle2, FileText } from "lucide-react";
import { ErrorToast } from "../../../../../presentation/common/error/ErrorToast";
import type { useImportCases } from "../../../state/import/use-import-cases";
import { ImportPreviewTree } from "../../../presentation/ImportPreviewTree";
import { importCopy } from "../../../localization/import-copy";
import css from "../page/import-page.module.css";

export function ImportReview({ state, ru, preparationProject, onContinue, onRestart }: {
  state: ReturnType<typeof useImportCases>; ru: boolean; preparationProject: string; onContinue: () => void; onRestart: () => void;
}) {
  const copy = importCopy[ru ? "ru" : "en"];
  const successful = state.phase === "success";
  const interrupted = state.phase === "partial" || state.phase === "stopped";
  const plan = state.locked ? state.plan : state.sourcePlan;
  return <section className={css.review}>
    <header className={css.reviewHeader}><div className={css.fileTitle}>
      {successful ? <CheckCircle2 size={22} className={css.success} aria-hidden="true" /> : <FileText size={22} strokeWidth={1.5} aria-hidden="true" />}
      <div><h2>{successful ? copy.complete : interrupted ? (state.phase === "stopped" ? copy.stopped : copy.partial) : ru ? "Проверьте структуру" : "Review your test cases"}</h2>
        <p title={state.fileName}>{state.fileName}</p></div></div>
      {!state.locked && <Button size="sm" radius="full" variant="light" className={css.quiet} onPress={onRestart}>{copy.replace}</Button>}
    </header>
    <div className={css.summary} role="status">
      <span><strong>{state.document?.testCases.length ?? 0}</strong> {ru ? "кейсов" : "test cases"}</span>
      <span><strong>{plan?.folders.length ?? 0}</strong> {ru ? "папок" : "folders"}</span>
      <span>{state.locked ? (ru ? "Проект назначения: " : "Destination: ") : (ru ? "Подготовлено в проекте: " : "Prepared in: ")}
        <strong>{state.locked ? state.targetProject.name : preparationProject}</strong></span>
    </div>
    <ErrorToast message={state.error} />
    {interrupted && <p className={css.message}>{copy.partialRule}</p>}
    {state.failed.length > 0 && <Accordion variant="light" className={css.failures}>
      <AccordionItem key="failures" title={`${copy.errors}: ${state.failed.length}`}>
        <ul>{state.failed.map((item, index) => <li key={index}>{item.sourceKey}: {item.message}</li>)}</ul>
      </AccordionItem></Accordion>}
    {plan && <div className={css.reviewTree}><ImportPreviewTree plan={plan} copy={copy} neutral={!state.locked} /></div>}
    <footer className={css.stepFooter}><p>{successful ? `${state.completed} / ${state.document?.testCases.length ?? 0}`
      : state.locked ? state.targetProject.name : ru ? "Выберите проект и папку на следующем шаге." : "Choose a project and folder next."}</p>
      {successful ? <Button radius="full" className={css.primary} onPress={onRestart}>{ru ? "Импортировать ещё" : "Import another file"}</Button>
        : state.locked ? <><Button radius="full" variant="light" className={css.quiet} onPress={onRestart}>{copy.replace}</Button>
          <Button radius="full" className={css.primary} isDisabled={state.busy || !state.plan || !state.context} onPress={() => void state.start()}>{copy.retry}</Button></>
        : <Button radius="full" className={css.primary} isDisabled={!plan || !state.document || !state.document.testCases.length && !plan.folders.length}
          onPress={onContinue} endContent={<ArrowRight size={16} aria-hidden="true" />}>{copy.start}</Button>}
    </footer>
  </section>;
}
