import { useBatchComposer } from "../../../runs/batches/state/composer/useBatchComposer";
import { AnimatedSelect } from "../../common/select/AnimatedSelect";
import { MarkdownField } from "../../cases/inspector/markdown/MarkdownField";
import css from "../run/RunDialog.module.css";

export function RunIterationFields({ state, ru }: {
  state: ReturnType<typeof useBatchComposer>; ru: boolean;
}) {
  const iteration = state.iterations.find((item) => item.id === state.iterationId);
  return <section className={css.iteration}>
    <label className={css.fieldRow}><span>{ru ? "Итерация" : "Iteration"}</span><AnimatedSelect label={ru ? "Итерация" : "Iteration"}
      value={state.iterationId} onChange={state.setIterationId} options={[{ value: "", label: ru ? "Новая итерация" : "New iteration" },
        ...state.iterations.map((item) => ({ value: item.id, label: item.name }))]} /></label>
    {!state.iterationId && <>
      <label className={css.fieldRow}><span>{ru ? "Название итерации" : "Iteration title"}</span><input required maxLength={200}
        value={state.name} onChange={(event) => state.setName(event.target.value)} placeholder={ru ? "Например, Релиз 2.4" : "For example, Release 2.4"} /></label>
      <div className={css.narrative}>
        <h3>{ru ? "Описание" : "Description"}</h3>
        <div className={css.description}><MarkdownField appearance="plain" compact allowAttachments={false} label={ru ? "Описание итерации" : "Iteration description"}
          value={state.description} onChange={state.setDescription} /></div>
      </div>
    </>}
    {iteration && <>
      <div className={css.narrative}><h3>{ru ? "Описание итерации" : "Iteration description"}</h3>
        <MarkdownField appearance="plain" compact allowAttachments={false} label={ru ? "Описание итерации" : "Iteration description"}
          value={iteration.description} emptyLabel={ru ? "Описание не указано" : "No description"} />
      </div>
    </>}
  </section>;
}
