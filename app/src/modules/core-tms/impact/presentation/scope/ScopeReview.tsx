import { useEffect, useRef, useState } from "react";
import type { ImpactAnalysis, ImpactCommand, ImpactScope } from "../../model/impact-types";
import { CasePicker } from "../scope-picker/CasePicker";
import { ReviewCollection } from "../review/ReviewCollection";
import { impactLabel } from "../../model/impact-copy";
import { ScopeTestRow } from "./ScopeTestRow";
import css from "../styles/impact.module.css";
import local from "./scope.module.css";
export function ScopeReview({ analysis, scope, ru, writable, pending, command }: {
  analysis: ImpactAnalysis; scope: ImpactScope; ru: boolean; writable: boolean; pending: boolean;
  command: (input: ImpactCommand) => Promise<void>;
}) {
  const [picking, setPicking] = useState(false);
  const [changing, setChanging] = useState<{ owner: string; caseId: string } | null>(null);
  const owner = `${scope.workspaceId}:${scope.projectId}:${analysis.id}`;
  const currentOwner = useRef(owner); currentOwner.current = owner;
  const operation = useRef<{ owner: string; caseId: string } | null>(null);
  useEffect(() => () => { if (operation.current?.owner === owner) operation.current = null; }, [owner]);
  const changingCaseId = changing?.owner === owner ? changing.caseId : null;
  const busy = pending || Boolean(changingCaseId);
  const ids = analysis.scope.filter((item) => item.included).map((item) => item.testCaseId);
  const recommendations = analysis.result?.selectedTestCases.filter((item) => !analysis.scope.some((entry) => entry.testCaseId === item.testCaseId)) ?? [];
  const editable = writable && analysis.canEditScope;
  const change = async (caseId: string, included: boolean) => {
    if (!editable || pending || operation.current?.owner === owner) return;
    const started = { owner, caseId }; operation.current = started; setChanging(started);
    try {
      await command({ action: "scope", body: {
        caseIds: included ? [...new Set([...ids, caseId])] : ids.filter((id) => id !== caseId),
      } });
    } finally {
      if (operation.current === started) {
        operation.current = null;
        if (currentOwner.current === owner) setChanging(null);
      }
    }
  };
  return <section className={local.scope} id="impact-scope-review">
    <header className={local.heading}><div><h3>{ru ? "Состав проверки" : "Verification scope"}<span>{ids.length} / {analysis.scope.length}</span></h3>
      <p>{ru ? "Falcon предлагает тесты. QA проверяет причины и подтверждает итоговый состав." : "Falcon proposes tests. QA reviews the reasons and approves the final scope."}</p></div>
      {editable && <button type="button" onClick={() => setPicking((value) => !value)}>{picking ? (ru ? "Закрыть выбор" : "Close picker") : (ru ? "Добавить тест" : "Add test")}</button>}</header>
    {analysis.scope.length === 0 && <p className={css.empty}>{recommendations.length
      ? (ru ? "Рекомендации готовы, но состав прогона ещё не создан. Проверьте готовность сборки." : "Recommendations are available, but the run scope has not been created. Check build readiness.")
      : (ru ? "В составе ещё нет тестов. Добавьте готовый тест или создайте черновик для пробела покрытия." : "No tests in scope yet. Add a ready test or create a draft for a coverage gap.")}</p>}
    <ReviewCollection items={recommendations} ru={ru} label={ru ? "Рекомендации Falcon" : "Falcon recommendations"}
      text={(item) => [item.testCaseId, item.reason, ...item.changedFiles].join(" ")}>{(item) => <ScopeTestRow key={item.testCaseId}
        caseId={item.testCaseId} selection={item} editable={false} ru={ru} />}</ReviewCollection>
    <ReviewCollection items={analysis.scope} ru={ru} label={ru ? "Тесты в составе" : "Scope tests"}
      text={(item) => [item.testCaseKey, item.testCaseId, item.title].filter(Boolean).join(" ")}>{(item) => {
      const selection = analysis.result?.selectedTestCases.find((entry) => entry.testCaseId === item.testCaseId);
      return <ScopeTestRow key={item.testCaseId} caseId={item.testCaseId} caseKey={item.testCaseKey} title={item.title}
        origin={item.origin} revision={item.revision} included={item.included} selection={selection} editable={editable} ru={ru}
        pending={busy} saving={changingCaseId === item.testCaseId}
        onToggle={() => { void change(item.testCaseId, !item.included); }} />;
    }}</ReviewCollection>
    {picking && editable && <CasePicker scope={scope} ru={ru} included={ids} disabled={busy} onAdd={(id) => change(id, true)} />}
    {!analysis.approved && analysis.approvalBlockedReasons.length > 0 && <ul className={local.blockers}>{analysis.approvalBlockedReasons.map((reason) => <li key={reason}>{impactLabel(reason, ru)}</li>)}</ul>}
    <footer className={local.footer}><p className={css.muted}>{analysis.approved
      ? (analysis.canEditScope ? (ru ? "Состав подтверждён. Изменение состава потребует нового подтверждения." : "Scope approved. Editing it will require approval again.")
        : (ru ? "Состав подтверждён. Результаты выполненных проверок сохраняются неизменными." : "Scope approved. Existing execution results remain unchanged."))
      : !analysis.canApprove ? (ru ? "Подтверждение пока недоступно. Проверьте анализ, готовность сборки и состав тестов." : "Approval is unavailable. Review analysis, build readiness, and test scope.")
        : (ru ? "Подтверждение разрешит запуск предложенного тест-рана." : "Approval allows the proposed test run to start.")}</p>
      {!analysis.approved && writable && <button type="button" className={css.primary} disabled={!analysis.canApprove || busy}
        onClick={() => void command({ action: "approve", body: {} })}>{ru ? "Подтвердить состав" : "Approve scope"}</button>}</footer>
  </section>;
}
