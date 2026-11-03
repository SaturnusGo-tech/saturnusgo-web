"use client";
import dynamic from "next/dynamic";
import { Braces, Database, FileJson2, Server } from "lucide-react";
import { visitWorkspace } from "../../state/navigation/browser/workspace-history";
import { pluginSettingsLink } from "../config/navigation/plugins/plugin-settings-route";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import type { Scope } from "../../connectors/model/connector-types";
import { useApiSourceList } from "../../api-sources/state/useApiSourceList";
import { useApiDocument } from "../../api-sources/state/useApiDocument";
import { useApiContext } from "../../api-sources/scope/useApiContext";
import { apiContextKey } from "../../api-sources/scope/api-context";
import { useApiSelection } from "../../api-sources/selection/useApiSelection";
import { apiSourceError } from "../../api-sources/model/api-source-error";
import { AnimatedSelect } from "../common/select/AnimatedSelect";
import { ContentSkeleton } from "../common/skeleton/ContentSkeleton";
import { ApiTestingActions } from "./actions/ApiTestingActions";
import surface from "./api-testing.module.css";
const SwaggerDocument = dynamic(() => import("./renderer/SwaggerDocument"), {
  ssr: false, loading: () => <ContentSkeleton label="Swagger" />,
});
export function ApiTestingView({ scope, canManage }: { scope: Scope; canManage: boolean }) {
  const { locale, t } = useTmsLocale(); const ru = locale === "ru";
  const { context } = useApiContext(scope.projectId); const contextKey = apiContextKey(context);
  const list = useApiSourceList(scope.workspaceId, context, false);
  const selection = useApiSelection(scope.workspaceId, contextKey, list.items, list.loading);
  const source = selection.source;
  const state = useApiDocument(scope.workspaceId, context, source);
  const configure = () => visitWorkspace(pluginSettingsLink(window.location.href, "swagger", true));
  const manage = () => visitWorkspace(pluginSettingsLink(window.location.href, "swagger"));
  const retry = () => { list.refresh(); state.reload(); };
  const error = list.error || state.error;
  return <section className={surface.page} data-testid="api-testing-view">
    <header className={surface.header}><h1>{t("apiTesting.title")}</h1>
      {!list.loading && list.items.length > 1 && <AnimatedSelect className={surface.sourceSelector} label={ru ? "Сервис API" : "API service"}
        value={source?.id ?? ""} options={[{ value: "", label: ru ? "Выберите API" : "Choose an API" }, ...list.items.map(item => ({ value: item.id, label: `${item.name}${item.enabled ? "" : ru ? " · отключён" : " · disabled"}` }))]}
        onChange={value => { if (value) selection.select(value); }} />}
      {list.items.length === 1 && <span className={surface.sourceName} title={source?.name}>{source?.name}</span>}
      <ApiTestingActions canManage={canManage && list.items.length > 0} disabled={list.loading || state.loading} ru={ru} onManage={manage} onRefresh={retry} />
    </header>
    <div className={surface.webview}>
      {(list.loading || state.loading) && <ContentSkeleton variant="list" label={t("common.loading")}/>}
      {!list.loading && !state.loading && Boolean(error) && <div className={surface.state} role="alert"><h2>{ru ? "Не удалось загрузить API" : "Unable to load API"}</h2><p>{apiSourceError(error, ru)}</p><button type="button" onClick={retry}>{ru ? "Повторить" : "Retry"}</button></div>}
      {!list.loading && !list.error && !list.items.length && <div className={`${surface.state} ${surface.empty}`}>
        <div className={surface.network} aria-hidden="true"><svg viewBox="0 0 192 116"><path d="M42 29H72Q96 29 96 53V63M42 87H72Q96 87 96 63M96 58H153"/></svg>
          <span className={surface.service}><Braces size={23}/></span><span className={surface.database}><Database size={23}/></span>
          <span className={surface.specification}><FileJson2 size={28}/></span><span className={surface.server}><Server size={23}/></span></div>
        <h2>{ru ? "Ваши API — в одном месте" : "Your APIs, connected"}</h2>
        <p>{canManage ? (ru ? "Подключите спецификацию OpenAPI или Swagger, чтобы изучать и проверять методы API прямо в Falcon." : "Connect an OpenAPI or Swagger specification to explore and test API endpoints in Falcon.") : (ru ? "Попросите администратора подключить спецификацию OpenAPI или Swagger к этому проекту." : "Ask an administrator to connect an OpenAPI or Swagger specification to this project.")}</p>
        {canManage && <button className={surface.primary} type="button" onClick={configure}>{ru ? "Подключить Swagger" : "Connect Swagger"}</button>}</div>}
      {!list.loading && !list.error && list.items.length > 1 && !source && <div className={surface.state}><h2>{ru ? "Выберите API" : "Choose an API"}</h2><p>{ru ? "В этой области доступно несколько сервисов." : "Several services are available in this scope."}</p></div>}
      {source && !source.enabled && <div className={surface.state}><h2>{ru ? "Подключение отключено" : "Connection disabled"}</h2><p>{source.name}</p>{canManage && <button type="button" onClick={configure}>{ru ? "Настроить подключение" : "Manage connection"}</button>}</div>}
      {!list.loading && !state.loading && !error && state.document && source && <SwaggerDocument
        key={`${scope.workspaceId}:${contextKey}:${source.id}:${source.rowVersion}:${state.document.fetchedAt}`} specification={state.document} sourceUrl={source.sourceUrl}/>}
    </div>
  </section>;
}
