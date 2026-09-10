import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import type { useExternalImport } from "../../state/normalization/use-external-import";
import type { TestCaseExchangeDocument } from "../../model/test-case-exchange";
import css from "./normalization-review.module.css";
export function ImportNormalizationReview({ state, document, ru }: {
  state: ReturnType<typeof useExternalImport>; document: TestCaseExchangeDocument | null; ru: boolean;
}) {
  const [index, setIndex] = useState(0);
  if (!state.active) return null;
  const progress = state.progress;
  const item = progress.cases[Math.min(index, Math.max(0, progress.cases.length - 1))];
  const warnings = (code: string) => code === "INCOMPLETE_STEPS"
    ? ru ? "У шагов нет ожидаемого результата. Исходная процедура сохранена в описании." : "Steps lack an expected result. The original procedure is preserved in the description."
    : code === "SOURCE_FIELDS_PRESERVED"
      ? ru ? "Дополнительные поля сохранены в тестовых данных." : "Additional source fields are preserved in test data."
      : ru ? "Нет полной процедуры. Проверьте кейс перед использованием." : "No complete procedure. Review the case before using it.";
  return <section className={css.section} aria-label={ru ? "Преобразование JSON" : "JSON conversion"}>
    {!document && <>
      <p>{ru ? "Преобразовать внешний JSON в формат Falcon и распределить кейсы по папкам." : "Convert external JSON into Falcon format and organize cases into folders."}</p>
      <small>{ru ? "Файл обрабатывается через OpenRouter. До проверки результата кейсы не сохраняются." : "The file is processed through OpenRouter. Cases are saved only after you review the result."}</small>
      {!state.busy && <button type="button" onClick={() => void state.convert()}>
        {progress.processed ? (ru ? "Продолжить преобразование" : "Resume conversion") : ru ? "Преобразовать с OpenRouter" : "Convert with OpenRouter"}
      </button>}
    </>}
    {state.busy && <div role="status" className={css.progress}>
      <span><LoaderCircle size={15} />{progress.records ? (ru ? `Обработано ${progress.processed} из ${progress.records.length}` : `Processed ${progress.processed} of ${progress.records.length}`) : ru ? "Определяем структуру файла…" : "Reading the file structure…"}</span>
      {progress.records && <progress value={progress.processed} max={progress.records.length} />}
    </div>}
    {state.error && <p role="alert">{state.error}</p>}
    {document && <>
      <p>{ru ? `Распознано: ${progress.records?.length ?? 0}. Подготовлено: ${progress.cases.length}. Исключено: ${progress.issues.length}.` : `Recognized: ${progress.records?.length ?? 0}. Prepared: ${progress.cases.length}. Excluded: ${progress.issues.length}.`}</p>
      <small>{ru ? "Кейсы будут созданы как черновики. Сверьте количество и содержание с исходным файлом." : "Cases will be created as drafts. Compare the count and content with the source file."}</small>
      {item && <details className={css.preview}>
        <summary>{ru ? "Проверить содержание кейсов" : "Review case content"}</summary>
        <select aria-label={ru ? "Кейс для проверки" : "Case to review"} value={Math.min(index, progress.cases.length - 1)} onChange={e => setIndex(Number(e.target.value))}>
          {progress.cases.map((c, i) => <option key={c.sourcePath} value={i}>{i + 1}. {c.value.title}</option>)}
        </select>
        <small>{item.value.folderPath.split("/").filter(Boolean).join(" › ")}</small>
        <strong>{item.value.title}</strong>
        {item.warnings.map(code => <p key={code} className={css.warning}>{warnings(code)}</p>)}
        {item.value.description && <p className={css.content}>{item.value.description}</p>}
        {item.value.preconditions && <><strong>{ru ? "Предусловия" : "Preconditions"}</strong><p className={css.content}>{item.value.preconditions}</p></>}
        <ol>{item.value.steps.map(step => <li key={step.order}><p>{step.action}</p><small>{ru ? "Ожидаемый результат" : "Expected result"}</small><p>{step.expectedResult}</p>{step.testData && <p>{step.testData}</p>}</li>)}</ol>
        <ul>{item.value.checklist.map(c => <li key={c.order}>{c.text}</li>)}</ul>
        {item.value.testData && <><strong>{ru ? "Тестовые данные и исходные поля" : "Test data and source fields"}</strong><pre>{item.value.testData}</pre></>}
      </details>}
      {progress.issues.length > 0 && <details className={css.preview}><summary>{ru ? "Не будут импортированы" : "Excluded from import"}: {progress.issues.length}</summary>
        <ul>{progress.issues.map(issue => <li key={issue.sourcePath}>{issue.sourcePath || (ru ? "Корень файла" : "File root")} · {ru ? "Нужно проверить исходные поля" : "Source fields require review"}</li>)}</ul>
      </details>}
      <label className={css.confirm}><input type="checkbox" checked={state.reviewed} onChange={e => state.setReviewed(e.target.checked)} />
        {ru ? `Я проверил результат. Импортировать ${progress.cases.length} кейсов${progress.issues.length ? `, исключив ${progress.issues.length}` : ""}.` : `I reviewed the result. Import ${progress.cases.length} cases${progress.issues.length ? `, excluding ${progress.issues.length}` : ""}.`}
      </label>
    </>}
  </section>;
}
