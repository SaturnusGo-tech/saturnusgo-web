"use client";
import SwaggerUI from "swagger-ui-react";
import { useMemo, useState } from "react";
import { ChevronDown, Settings2 } from "lucide-react";
import "swagger-ui-react/swagger-ui.css";
import type { SwaggerSpecification } from "../../../connectors/model/swagger/swagger-specification";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { apiServers, documentForServer, requireSelectedServer } from "../../../api-sources/execution/api-servers";
import { AnimatedSelect } from "../../common/select/AnimatedSelect";
import { AnimatedSearch } from "../../common/search/AnimatedSearch";
import { useDisclosureMotion } from "../../common/disclosure/useDisclosureMotion";
import { filterApiOperations } from "../model";
import { authorizeSwaggerRequest } from "./swagger-request-policy";
import styles from "./swagger-document.module.css";
export default function SwaggerDocument({ specification, sourceUrl }: { specification: SwaggerSpecification; sourceUrl: string }) {
  const ru = useTmsLocale().locale === "ru";
  const [server, setServer] = useState(""), [query, setQuery] = useState(""), [settings, setSettings] = useState(false);
  const motion = useDisclosureMotion(settings);
  const servers = useMemo(() => apiServers(specification.document, sourceUrl), [specification, sourceUrl]);
  const document = useMemo(() => filterApiOperations(documentForServer(specification.document, server), query), [specification, server, query]);
  return <div className={styles.document} data-settings-open={settings || undefined}>
    <div className={styles.toolbar}>
      <AnimatedSearch value={query} onChange={setQuery} label={ru ? "Найти метод API" : "Search endpoints"}
        placeholder={ru ? "Путь, метод или название" : "Path, method or name"} closeLabel={ru ? "Закрыть поиск" : "Close search"}/>
      <button type="button" className={styles.settingsToggle} aria-expanded={settings} aria-controls="api-request-settings" onClick={() => setSettings(value => !value)}>
        <Settings2 size={15}/>{ru ? "Параметры запросов" : "Request settings"}<ChevronDown size={13}/></button>
    </div>
    {motion.present && <div ref={element => { motion.ref.current = element; if (element) element.inert = !settings; }} id="api-request-settings" aria-hidden={!settings || undefined}>
      <div className={styles.executionServer}><label>{ru ? "Сервер запросов" : "Request server"}</label>
        <AnimatedSelect label={ru ? "Сервер запросов" : "Request server"} value={server} onChange={setServer}
          options={[{ value: "", label: ru ? "Выберите сервер" : "Choose a server" }, ...servers.map(url => ({ value: url, label: url }))]}/>
        {!server && <p>{ru ? "Выберите сервер перед отправкой запросов." : "Select a server before sending requests."}</p>}
      </div>
    </div>}
    {query && !Object.keys((document.paths ?? {}) as object).length && <p className={styles.noMatches} role="status">{ru ? "Методы не найдены. Измените запрос." : "No matching endpoints. Try another search."}</p>}
    <SwaggerUI key={server} spec={document} queryConfigEnabled={false} withCredentials={false} persistAuthorization={false}
      supportedSubmitMethods={server ? ["get", "put", "post", "delete", "options", "head", "patch", "trace"] : []}
      docExpansion="list" filter={false} displayRequestDuration defaultModelsExpandDepth={-1}
      requestInterceptor={(request) => {
        const url = String(request.url ?? ""); requireSelectedServer(url, server);
        return authorizeSwaggerRequest({ ...request, url }, window.location.origin);
      }} />
  </div>;
}
