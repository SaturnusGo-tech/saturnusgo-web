import { useBatchComposer } from "../../../runs/batches/state/composer/useBatchComposer";
import { ResponsiblePicker } from "../../../workspace/members/presentation/ResponsiblePicker";
import { AnimatedSelect } from "../../common/select/AnimatedSelect";
import { MarkdownField } from "../../cases/inspector/markdown/MarkdownField";
import css from "../run/RunDialog.module.css";

export function RunIterationFields({ state, workspaceId, offline, ru }: {
  state: ReturnType<typeof useBatchComposer>; workspaceId: string; offline: boolean; ru: boolean;
}) {
  return <section className={css.iteration}>
    <label className={css.fieldRow}><span>{ru ? "Итерация" : "Iteration"}</span><AnimatedSelect label={ru ? "Итерация" : "Iteration"}
      value={state.iterationId} onChange={state.setIterationId} options={[{ value: "", label: ru ? "Новая итерация" : "New iteration" },
        ...state.iterations.map((item) => ({ value: item.id, label: item.name }))]} /></label>
    {!state.iterationId && <>
      <label className={css.fieldRow}><span>{ru ? "Название итерации" : "Iteration title"}</span><input required maxLength={200}
        value={state.name} onChange={(event) => state.setName(event.target.value)} placeholder={ru ? "Например, Релиз 2.4" : "For example, Release 2.4"} /></label>
      <details className={css.details}><summary>{ru ? "Описание и теги" : "Description and tags"}</summary>
        <div className={css.description}><MarkdownField appearance="plain" compact allowAttachments={false} label={ru ? "Описание итерации" : "Iteration description"}
          value={state.description} onChange={state.setDescription} /></div>
        <label className={css.fieldRow}><span>{ru ? "Теги" : "Tags"}</span><input value={state.tags} onChange={(event) => state.setTags(event.target.value)}
          placeholder={ru ? "Через запятую" : "Separated by commas"} /></label>
      </details>
    </>}
    <details className={css.details}><summary>{ru ? "Сборка и ответственный" : "Build and assignee"}</summary>
      <div className={css.settings}><label className={css.fieldRow}><span>{ru ? "Сборка" : "Build"}</span><input maxLength={500} value={state.build}
        placeholder={ru ? "Номер сборки" : "Build number"} onChange={(event) => state.setBuild(event.target.value)} /></label>
        <div><span>{ru ? "Ответственный" : "Assignee"}</span><ResponsiblePicker workspaceId={workspaceId}
          value={state.assignee} onChange={state.setAssignee} offline={offline} disabled={state.busy} /></div></div>
      <p className={css.hint}>{ru ? "Без общего назначения сохраняются ответственные за кейсы. Основное окружение берётся из проекта, если оно настроено." : "Case assignees are inherited unless overridden. A project’s default environment is included when configured."}</p>
    </details>
  </section>;
}
