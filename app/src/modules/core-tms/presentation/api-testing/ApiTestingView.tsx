"use client";
import dynamic from "next/dynamic";
import { FileJson2, RefreshCw, Settings2 } from "lucide-react";
import { useState } from "react";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import type { Scope } from "../../connectors/model/connector-types";
import { useApiSourceList } from "../../api-sources/state/useApiSourceList";
import { useApiDocument } from "../../api-sources/state/useApiDocument";
import { useApiContext } from "../../api-sources/scope/useApiContext";
import { apiContextKey } from "../../api-sources/scope/api-context";
import { useApiSelection } from "../../api-sources/selection/useApiSelection";
import { ApiSourceManager } from "../../api-sources/presentation/ApiSourceManager";
import { apiSourceError } from "../../api-sources/model/api-source-error";
import { AnimatedSelect } from "../common/select/AnimatedSelect";
import { ContentSkeleton } from "../common/skeleton/ContentSkeleton";
import surface from "./api-testing.module.css";
const SwaggerDocument = dynamic(() => import("./renderer/SwaggerDocument"), {
  ssr: false, loading: () => <ContentSkeleton label="Swagger" />,
});
export function ApiTestingView({ scope, canManage }: { scope: Scope; canManage: boolean }) {
  const { locale, t } = useTmsLocale(); const ru = locale === "ru";
  const [manage, setManage] = useState(false); const managing = manage && canManage;
  const { context } = useApiContext(scope.projectId); const contextKey = apiContextKey(context);
  const list = useApiSourceList(scope.workspaceId, context, false, !managing);
  const selection = useApiSelection(scope.workspaceId, contextKey, list.items, list.loading);
  const source = selection.source;
  const state = useApiDocument(scope.workspaceId, context, managing ? null : source);
  const configure = () => setManage(true);
  const retry = () => { list.refresh(); state.reload(); };
  if (managing) return <ApiSourceManager workspaceId={scope.workspaceId} projectId={scope.projectId}
    onBack={() => { setManage(false); list.refresh(); }} onSaved={() => list.refresh()} />;
  const error = list.error || state.error;
  return <section className={surface.page} data-testid="api-testing-view">
    <header className={surface.header}><h1>{t("apiTesting.title")}</h1>
      {!list.loading && list.items.length > 0 && <AnimatedSelect className={surface.sourceSelector} label={ru ? "Сервис API" : "API service"}
        value={source?.id ?? ""} options={[{ value: "", label: ru ? "Выберите API" : "Choose an API" }, ...list.items.map(item => ({ value: item.id, label: `${item.name}${item.enabled ? "" : ru ? " · отключён" : " · disabled"}` }))]}
        onChange={value => { if (value) selection.select(value); }} />}
      <div className={surface.actions}>{canManage && <button type="button" onClick={configure}><Settings2 size={15}/>{ru ? "Подключения" : "Connections"}</button>}
        <button type="button" onClick={retry} disabled={list.loading || state.loading} aria-label={ru ? "Обновить API" : "Refresh API"}><RefreshCw size={15}/></button></div>
    </header>
    <div className={surface.webview}>
      {(list.loading || state.loading) && <ContentSkeleton variant="list" label={t("common.loading")}/>}
      {!list.loading && !state.loading && Boolean(error) && <div className={surface.state} role="alert"><h2>{ru ? "Не удалось загрузить API" : "Unable to load API"}</h2><p>{apiSourceError(error, ru)}</p><button type="button" onClick={retry}>{ru ? "Повторить" : "Retry"}</button></div>}
      {!list.loading && !list.error && !list.items.length && <div className={surface.state}><FileJson2 size={30}/><h2>{ru ? "Для выбранной области нет API" : "No APIs for this scope"}</h2>
        <p>{canManage ? (ru ? "Выберите проекты в существующем подключении или добавьте новый API." : "Link an existing connection to these projects, or add an API.") : (ru ? "Попросите администратора подключить API к этим проектам." : "Ask an administrator to connect an API to these projects.")}</p>
        {canManage && <button className={surface.primary} type="button" onClick={configure}>{ru ? "Подключения API" : "API connections"}</button>}</div>}
      {!list.loading && !list.error && list.items.length > 1 && !source && <div className={surface.state}><h2>{ru ? "Выберите API" : "Choose an API"}</h2><p>{ru ? "В этой области доступно несколько сервисов." : "Several services are available in this scope."}</p></div>}
      {source && !source.enabled && <div className={surface.state}><h2>{ru ? "Подключение отключено" : "Connection disabled"}</h2><p>{source.name}</p>{canManage && <button type="button" onClick={configure}>{ru ? "Настроить подключение" : "Manage connection"}</button>}</div>}
      {!list.loading && !state.loading && !error && state.document && source && <SwaggerDocument
        key={`${scope.workspaceId}:${contextKey}:${source.id}:${source.rowVersion}:${state.document.fetchedAt}`} specification={state.document} sourceUrl={source.sourceUrl}/>}
    </div>
  </section>;
}
