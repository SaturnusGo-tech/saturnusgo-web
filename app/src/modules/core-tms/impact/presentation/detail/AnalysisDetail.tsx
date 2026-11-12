import { IntegrationButton } from "../../../presentation/common/integration-controls/button/IntegrationButton";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { ErrorToast } from "../../../presentation/common/error/ErrorToast";
import { useImpactAnalysis } from "../../application/detail/useImpactAnalysis";
import type { ImpactPermissions, ImpactScope } from "../../model/impact-types";
import { ScopeReview } from "../scope/ScopeReview";
import { CoverageGaps } from "../gaps/CoverageGaps";
import { AnalysisHistory } from "../history/AnalysisHistory";
import { ImpactAiBanner } from "../banner/ImpactAiBanner";
import { AnalysisSummary } from "./AnalysisSummary";
import { AnalysisChanges } from "../evidence/AnalysisChanges";
import shared from "../styles/impact.module.css";
import css from "./detail.module.css";

export function AnalysisDetail({ scope, id, ru, permissions, onBack }: {
  scope: ImpactScope; id: string; ru: boolean; permissions: ImpactPermissions; onBack: () => void;
}) {
  const state = useImpactAnalysis(scope, id, permissions, ru), data = state.data;
  const [tab, setTab] = useState("scope"), panelId = useId(), tabsRef = useRef<HTMLElement>(null);
  const busy = state.pending || Boolean(state.unresolved) || !state.identityReady || !state.etag;
  const tabs = [
    { id: "scope", label: ru ? "Состав проверки" : "Verification scope", count: data?.scope.length ?? 0 },
    { id: "gaps", label: ru ? "Пробелы покрытия" : "Coverage gaps", count: data?.result?.coverageGaps.length ?? 0 },
    { id: "changes", label: ru ? "Изменения" : "Changes", count: data?.change.files.length ?? 0 },
    ...(permissions.audit ? [{ id: "activity", label: ru ? "Журнал" : "Activity", count: null }] : []),
  ];
  const activeTab = tabs.some(item => item.id === tab) ? tab : "scope";
  const keyboard = (event: KeyboardEvent<HTMLElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const index = tabs.findIndex(item => item.id === activeTab);
    const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1
      : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    setTab(tabs[next].id); tabsRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  };
  return <div className={css.detail}>
    <div className={css.topbar}><IntegrationButton type="button" className={css.quiet} onPress={onBack}><ArrowLeft size={15} />{ru ? "Все анализы" : "All analyses"}</IntegrationButton>
      <IntegrationButton type="button" className={css.icon} title={ru ? "Обновить" : "Refresh"} aria-label={ru ? "Обновить анализ" : "Refresh analysis"}
        isDisabled={state.pending || state.loading} onPress={() => void state.refresh()}><RefreshCw size={15} /></IntegrationButton></div>
    {data?.aiEnabled === false && <ImpactAiBanner ru={ru} />}
    <ErrorToast message={state.error} />
    {!state.identityReady && <p className={shared.notice}>{ru ? "Для сохранения решений войдите в аккаунт повторно." : "Sign in again to save review decisions."}</p>}
    {data && !state.etag && <p className={shared.notice}>{ru ? "Обновите анализ перед сохранением: его версия не подтверждена." : "Reload before saving: the analysis version could not be verified."}</p>}
    {state.loading && !data && <p role="status">{ru ? "Загружаем анализ…" : "Loading analysis…"}</p>}
    {state.unresolved && !state.pending && <div className={shared.notice} role="status"><p>{ru ? "У предыдущего действия ещё нет подтверждённого результата. Повтор безопасно проверит его завершение." : "A previous action has no confirmed result yet. Retry safely checks its outcome."}</p>
      <IntegrationButton type="button" isDisabled={state.pending || !state.canRetryUnresolved} onPress={() => state.unresolved && void state.command(state.unresolved.command)}>{ru ? "Повторить запрос" : "Retry request"}</IntegrationButton></div>}
    {data && <>
      <AnalysisSummary data={data} ru={ru} pending={busy} canRetry={permissions.configure} onRetry={() => void state.command({ action: "retry", body: {} })} />
      <nav ref={tabsRef} className={css.tabs} role="tablist" aria-label={ru ? "Проверка анализа" : "Analysis review"} onKeyDown={keyboard}>
        {tabs.map(item => <IntegrationButton type="button" key={item.id} id={`${panelId}-${item.id}-tab`} role="tab" aria-label={item.label} aria-selected={activeTab === item.id}
          aria-controls={`${panelId}-${item.id}`} tabIndex={activeTab === item.id ? 0 : -1} onPress={() => setTab(item.id)}>{item.label}{item.count !== null && <span>{item.count}</span>}</IntegrationButton>)}
      </nav>
      <div className={css.tabPanel} role="tabpanel" id={`${panelId}-scope`} aria-labelledby={`${panelId}-scope-tab`} hidden={activeTab !== "scope"}>
        {!permissions.review && <p className={shared.notice}>{ru ? "Режим просмотра без права изменять и подтверждать состав." : "Read-only access: scope editing and approval are unavailable."}</p>}
        <ScopeReview analysis={data} scope={scope} ru={ru} writable={permissions.review} pending={busy} command={state.command} />
      </div>
      <div className={css.tabPanel} role="tabpanel" id={`${panelId}-gaps`} aria-labelledby={`${panelId}-gaps-tab`} hidden={activeTab !== "gaps"}>
        <CoverageGaps analysis={data} ru={ru} writable={permissions.manageCases} pending={busy} command={state.command} />
      </div>
      <div className={css.tabPanel} role="tabpanel" id={`${panelId}-changes`} aria-labelledby={`${panelId}-changes-tab`} hidden={activeTab !== "changes"}>
        <AnalysisChanges analysis={data} ru={ru} />
      </div>
      {permissions.audit && <div className={css.tabPanel} role="tabpanel" id={`${panelId}-activity`} aria-labelledby={`${panelId}-activity-tab`} hidden={activeTab !== "activity"}>
        <AnalysisHistory analysis={data} ru={ru} />
      </div>}
    </>}
  </div>;
}
