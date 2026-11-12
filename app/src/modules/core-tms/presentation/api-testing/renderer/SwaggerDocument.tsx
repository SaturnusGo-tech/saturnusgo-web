"use client";
import SwaggerUI from "swagger-ui-react";
import { useMemo, useState } from "react";
import { Select, SelectItem } from "@heroui/react";
import { Server } from "lucide-react";
import "swagger-ui-react/swagger-ui.css";
import type { SwaggerSpecification } from "../../../connectors/model/swagger/swagger-specification";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { apiServers, documentForServer, requireSelectedServer } from "../../../api-sources/execution/api-servers";
import { AnimatedSearch } from "../../common/search/AnimatedSearch";
import { filterApiOperations } from "../model";
import { authorizeSwaggerRequest } from "./swagger-request-policy";
import styles from "./swagger-document.module.css";
type Props = { specification: SwaggerSpecification; sourceUrl: string };
const submitMethods: ("get" | "put" | "post" | "delete" | "options" | "head" | "patch" | "trace")[] = ["get", "put", "post", "delete", "options", "head", "patch", "trace"];
// swagger-ui-react does not forward validatorUrl. Remove its online validator
// component through the supported plugin API instead of sending contracts out.
const privateDocumentPlugins = [{ components: { OnlineValidatorBadge: () => null } }];

export default function SwaggerDocument(props: Props) {
  // Server choice and API credentials belong to this exact document session.
  return <SwaggerRequestDocument key={`${props.sourceUrl}:${props.specification.fetchedAt}`} {...props} />;
}

function SwaggerRequestDocument({ specification, sourceUrl }: Props) {
  const ru = useTmsLocale().locale === "ru";
  const [selectedServer, setServer] = useState(""), [query, setQuery] = useState("");
  const servers = useMemo(() => apiServers(specification.document, sourceUrl), [specification, sourceUrl]);
  const server = servers.includes(selectedServer) ? selectedServer : "";
  const document = useMemo(() => filterApiOperations(documentForServer(specification.document, server), query), [specification, server, query]);
  return <div className={styles.document}>
    <div className={styles.toolbar}>
      <div className={styles.serverField}><span className={styles.serverLabel}>{ru ? "Сервер запросов" : "Request server"}</span>
      <Select aria-label={ru ? "Сервер запросов" : "Request server"}
        placeholder={ru ? "Выберите сервер" : "Choose a server"} size="sm" radius="lg" variant="flat"
        selectedKeys={server ? [server] : []} disallowEmptySelection disableAnimation startContent={<Server size={15} aria-hidden="true" />}
        classNames={{ base: styles.serverSelect, trigger: styles.serverTrigger, value: styles.serverValue, popoverContent: styles.serverMenu }}
        listboxProps={{ itemClasses: { base: styles.serverOption } }}
        onSelectionChange={keys => { if (keys !== "all") { const [value] = keys; if (typeof value === "string" && servers.includes(value)) setServer(value); } }}>
        {servers.map(url => <SelectItem key={url} textValue={url}>{url}</SelectItem>)}
      </Select></div>
      <AnimatedSearch value={query} onChange={setQuery} label={ru ? "Найти метод API" : "Search endpoints"}
        placeholder={ru ? "Путь, метод или название" : "Path, method or name"} closeLabel={ru ? "Закрыть поиск" : "Close search"}/>
    </div>
    <p className={styles.executionHint}>{server
      ? (ru ? "Откройте метод → Try it out → заполните параметры → Execute." : "Open an endpoint → Try it out → enter parameters → Execute.")
      : (ru ? "Выберите сервер для отправки запросов. Try it out открывает параметры метода." : "Choose a server to send requests. Try it out opens the endpoint parameters.")}</p>
    {query && !Object.keys((document.paths ?? {}) as object).length && <p className={styles.noMatches} role="status">{ru ? "Методы не найдены. Измените запрос." : "No matching endpoints. Try another search."}</p>}
    <SwaggerUI key={server} spec={document} queryConfigEnabled={false} withCredentials={false} persistAuthorization={false} plugins={privateDocumentPlugins}
      supportedSubmitMethods={submitMethods}
      docExpansion="list" filter={false} displayRequestDuration defaultModelsExpandDepth={-1}
      requestInterceptor={(request) => {
        const url = String(request.url ?? ""); requireSelectedServer(url, server);
        return authorizeSwaggerRequest({ ...request, url }, window.location.origin);
      }} />
  </div>;
}
