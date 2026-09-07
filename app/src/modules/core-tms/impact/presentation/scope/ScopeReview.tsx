import { useState } from "react";
import type { ImpactAnalysis, ImpactCommand, ImpactScope } from "../../model/impact-types";
import { useImpactCases } from "../../application/cases/useImpactCases";
import { impactLabel } from "../../model/impact-copy";
import css from "../styles/impact.module.css";
export function ScopeReview({ analysis, scope, ru, writable, pending, command }: {
  analysis: ImpactAnalysis; scope: ImpactScope; ru: boolean; writable: boolean; pending: boolean;
  command: (input: ImpactCommand) => Promise<void>;
}) {
  const [picking, setPicking] = useState(false);
  const ids = analysis.scope.filter((item) => item.included).map((item) => item.testCaseId);
  const recommendations = analysis.result?.selectedTestCases.filter((item) => !analysis.scope.some((entry) => entry.testCaseId === item.testCaseId)) ?? [];
  const editable = writable && !pending && analysis.canEditScope;
  const change = (caseId: string, included: boolean) => command({ action: "scope", body: {
    caseIds: included ? [...new Set([...ids, caseId])] : ids.filter((id) => id !== caseId),
  } });
  return <section className={css.panel}>
    <header className={css.heading}><div><h3>{ru ? "Состав проверки" : "Verification scope"}</h3>
      <p>{ru ? "Falcon предлагает тесты. QA проверяет причины и подтверждает итоговый состав." : "Falcon proposes tests. QA reviews the reasons and approves the final scope."}</p></div>
      {editable && <button type="button" onClick={() => setPicking((value) => !value)}>{picking ? (ru ? "Закрыть выбор" : "Close picker") : (ru ? "Добавить тест" : "Add test")}</button>}</header>
    {analysis.scope.length === 0 && <p className={css.empty}>{recommendations.length
      ? (ru ? "Рекомендации готовы, но состав прогона ещё не создан. Проверьте готовность сборки." : "Recommendations are available, but the run scope has not been created. Check build readiness.")
      : (ru ? "В составе ещё нет тестов. Добавьте готовый тест или создайте черновик для пробела покрытия." : "No tests in scope yet. Add a ready test or create a draft for a coverage gap.")}</p>}
    {recommendations.length > 0 && <ul className={css.list}>{recommendations.map((item) => <li className={css.row} key={item.testCaseId}>
      <div className={css.rowHeading}><strong>{item.testCaseId}</strong><span className={css.badge}>{ru ? "Рекомендация Falcon" : "Falcon recommendation"}</span></div>
      <p className={css.muted}>{item.reason}</p><ul className={css.files}>{item.changedFiles.map((file) => <li key={file}>{file}</li>)}</ul>
    </li>)}</ul>}
    <ul className={css.list}>{analysis.scope.map((item) => {
      const selection = analysis.result?.selectedTestCases.find((entry) => entry.testCaseId === item.testCaseId);
      return <li className={css.row} key={item.testCaseId}>
        <div className={css.rowHeading}><strong>{item.testCaseKey ?? item.testCaseId}{item.title && ` · ${item.title}`}</strong><span className={css.badge}>{item.origin === "manual" ? (ru ? "Добавлен QA" : "Added by QA") : "Falcon"}{item.revision ? ` · r${item.revision}` : ""}</span></div>
        <p className={css.muted}>{selection?.reason ?? (ru ? "Добавлен вручную при проверке состава." : "Added manually during scope review.")}</p>
        {selection && <details><summary>{ru ? "Связанные изменения" : "Related changes"} · {Math.round(selection.confidence * 100)}%</summary>
          <ul className={css.files}>{selection.changedFiles.map((path) => <li key={path}>{path}</li>)}</ul></details>}
        <div className={css.rowHeading}><span className={css.muted}>{item.included ? (ru ? "В составе" : "Included") : (ru ? "Исключён QA" : "Excluded by QA")}</span>
          {editable && <button type="button" onClick={() => void change(item.testCaseId, !item.included)}>{item.included ? (ru ? "Исключить" : "Remove") : (ru ? "Вернуть" : "Restore")}</button>}</div>
      </li>;
    })}</ul>
    {picking && writable && analysis.canEditScope && <CasePicker scope={scope} ru={ru} included={ids} disabled={pending} onAdd={(id) => change(id, true)} />}
    {!analysis.approved && analysis.approvalBlockedReasons.length > 0 && <ul className={css.files}>{analysis.approvalBlockedReasons.map((reason) => <li key={reason}>{impactLabel(reason, ru)}</li>)}</ul>}
    <footer className={css.heading} style={{ marginTop: 16, marginBottom: 0 }}><p className={css.muted}>{analysis.approved
      ? (analysis.canEditScope ? (ru ? "Состав подтверждён. Изменение состава потребует нового подтверждения." : "Scope approved. Editing it will require approval again.")
        : (ru ? "Состав подтверждён. Результаты выполненных проверок сохраняются неизменными." : "Scope approved. Existing execution results remain unchanged."))
      : !analysis.canApprove ? (ru ? "Подтверждение пока недоступно. Проверьте анализ, готовность сборки и состав тестов." : "Approval is unavailable. Review analysis, build readiness, and test scope.")
        : (ru ? "Подтверждение разрешит запуск предложенного тест-рана." : "Approval allows the proposed test run to start.")}</p>
      {!analysis.approved && writable && <button type="button" className={css.primary} disabled={!analysis.canApprove || pending}
        onClick={() => void command({ action: "approve", body: {} })}>{ru ? "Подтвердить состав" : "Approve scope"}</button>}</footer>
  </section>;
}
function CasePicker({ scope, ru, included, disabled, onAdd }: { scope: ImpactScope; ru: boolean; included: string[]; disabled: boolean; onAdd: (id: string) => Promise<void> }) {
  const state = useImpactCases(scope, ru);
  return <div className={css.panel} style={{ marginTop: 12 }}>
    <label className={css.field}>{ru ? "Поиск готовых тестов проекта" : "Search ready project tests"}
      <input type="search" maxLength={300} value={state.query} onChange={(event) => state.setQuery(event.target.value)} /></label>
    {state.error && <p role="alert" className={css.error}>{state.error}</p>}
    {state.loading && <p role="status">{ru ? "Загружаем тесты…" : "Loading tests…"}</p>}
    <ul className={css.list}>{state.items.map((item) => <li key={item.id} className={css.row}>
      <div className={css.rowHeading}><span><strong>{item.key}</strong> {item.title}</span>
        <button type="button" disabled={disabled || included.includes(item.id)} onClick={() => void onAdd(item.id)}>{included.includes(item.id) ? (ru ? "Добавлен" : "Included") : (ru ? "Добавить" : "Add")}</button></div>
    </li>)}</ul>
    {!state.loading && !state.error && state.items.length === 0 && <p className={css.muted}>{ru ? "Готовых тестов не найдено." : "No ready tests found."}</p>}
    {state.next && <button type="button" onClick={() => void state.more()} disabled={state.loading}>{ru ? "Загрузить ещё" : "Load more"}</button>}
  </div>;
}
