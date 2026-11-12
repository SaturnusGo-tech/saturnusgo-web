import { Button, Progress } from "@heroui/react";
import { FalconBrandMark } from "../../../../../../../shared/components/brand/FalconBrandMark";
import type { useImportCases } from "../../../state/import/use-import-cases";
import { importCopy } from "../../../localization/import-copy";
import css from "../page/import-page.module.css";

export function ImportProgress({ state, ru, visible }: { state: ReturnType<typeof useImportCases>; ru: boolean; visible: boolean }) {
  const copy = importCopy[ru ? "ru" : "en"];
  const status = state.phase === "saving" ? (ru ? "Сохраняем исходный файл" : "Saving the original file")
    : state.phase === "folders" ? copy.folderProgress : state.phase === "importing" ? copy.caseProgress
    : ru ? "Подготавливаем ваши кейсы" : "Preparing your test cases";
  return <section className={css.loading} aria-busy="true" aria-label={status}>
    <div className={css.loadingContent} data-visible={visible}>
      <FalconBrandMark className={css.brand} intro />
      <h2 role="status">{status}</h2>
      <p>{state.fileName}</p>
      {state.phase === "importing" && <Progress aria-label={copy.processed} className={css.importProgress}
        value={state.attempted} maxValue={state.document?.testCases.length || 1} showValueLabel
        valueLabel={`${state.completed} / ${state.document?.testCases.length ?? 0}`}
        classNames={{ indicator: css.progressIndicator }} />}
      {state.busy && <Button size="sm" variant="light" radius="full" className={css.quiet} onPress={state.stop}>{copy.stop}</Button>}
    </div>
  </section>;
}
