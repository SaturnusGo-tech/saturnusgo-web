"use client";
import dynamic from "next/dynamic";
import { FileJson2, RefreshCw, Send, Settings2 } from "lucide-react";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import type { Scope } from "../../connectors/model/connector-types";
import { useSwaggerSpecification } from "../../connectors/application/swagger/useSwaggerSpecification";
import { POSTMAN_WEB_URL, swaggerWorkspaceUrl } from "./model";
import surface from "./api-testing.module.css";
const SwaggerDocument = dynamic(() => import("./renderer/SwaggerDocument"), {
  ssr: false, loading: () => <div className={surface.state} role="status">Swagger…</div>,
});
export function ApiTestingView({ scope, canManage }: { scope: Scope; canManage: boolean }) {
  const { locale, t } = useTmsLocale();
  const ru = locale === "ru";
  const state = useSwaggerSpecification(scope, ru);
  const configure = () => window.location.assign(swaggerWorkspaceUrl(window.location.href, "hooks"));
  return <section className={surface.page} data-testid="api-testing-view">
    <header className={surface.header}><h1>{t("apiTesting.title")}</h1><div className={surface.actions}>
      {canManage && <button type="button" onClick={configure}><Settings2 size={15} />{ru ? "Подключение" : "Connection"}</button>}
      <button type="button" onClick={state.reload} disabled={state.status === "loading"} aria-label={ru ? "Обновить спецификацию" : "Refresh specification"}><RefreshCw size={15} /></button>
    </div></header>
    <nav className={surface.toolTabs} aria-label={t("apiTesting.toolsLabel")}>
      <button className={surface.toolTabActive} type="button" aria-current="page">Swagger</button>
      <a className={surface.toolTab} href={POSTMAN_WEB_URL} target="_blank" rel="noopener noreferrer"><Send size={15} />Postman</a>
      {state.specification && <span className={surface.meta}>{state.specification.operationCount} {ru ? "операций" : "operations"} · OpenAPI {state.specification.format}</span>}
    </nav>
    <div className={surface.webview}>
      {state.status === "loading" && <div className={surface.state} role="status"><RefreshCw size={22} /><p>{ru ? "Загружаем спецификацию проекта…" : "Loading the project specification…"}</p></div>}
      {state.status === "empty" && <div className={surface.state}><FileJson2 size={30} /><h2>{ru ? "Подключите API проекта" : "Connect your project’s API"}</h2>
        <p>{ru ? "Добавьте Swagger в хуках: укажите OpenAPI JSON или YAML и при необходимости данные доступа." : "Add Swagger in Integrations: enter an OpenAPI JSON or YAML URL and credentials if required."}</p>
        {canManage ? <button type="button" className={surface.primary} onClick={configure}>{ru ? "Подключить Swagger" : "Connect Swagger"}</button> :
          <p>{ru ? "Попросите администратора или QA-менеджера настроить подключение." : "Ask an administrator or QA manager to configure the connection."}</p>}</div>}
      {state.status === "error" && <div className={surface.state} role="alert"><h2>{ru ? "Не удалось загрузить Swagger" : "Unable to load Swagger"}</h2><p>{state.error}</p>
        <button type="button" onClick={state.reload}>{ru ? "Повторить" : "Retry"}</button>{canManage && <button type="button" onClick={configure}>{ru ? "Проверить подключение" : "Check connection"}</button>}</div>}
      {state.status === "ready" && state.specification && <>
        <p className={surface.hint}>{ru ? "Authorize — доступ к API. Execute отправляет реальный запрос на выбранный сервер. Для запросов сервер должен разрешать CORS с адреса Falcon." :
          "Authorize controls API access. Execute sends a real request to the selected server. The API server must allow CORS from Falcon."}</p>
        <SwaggerDocument key={state.specification.fetchedAt} specification={state.specification} />
      </>}
    </div>
  </section>;
}
