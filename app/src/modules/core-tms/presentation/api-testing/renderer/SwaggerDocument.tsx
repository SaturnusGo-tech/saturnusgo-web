"use client";
import SwaggerUI from "swagger-ui-react";
import { useMemo, useState } from "react";
import "swagger-ui-react/swagger-ui.css";
import type { SwaggerSpecification } from "../../../connectors/model/swagger/swagger-specification";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { apiServers, documentForServer, requireSelectedServer } from "../../../api-sources/execution/api-servers";
import { AnimatedSelect } from "../../common/select/AnimatedSelect";
import { authorizeSwaggerRequest } from "./swagger-request-policy";
import styles from "./swagger-document.module.css";
export default function SwaggerDocument({ specification, sourceUrl }: { specification: SwaggerSpecification; sourceUrl: string }) {
  const ru = useTmsLocale().locale === "ru"; const [server, setServer] = useState("");
  const servers = useMemo(() => apiServers(specification.document, sourceUrl), [specification, sourceUrl]);
  const document = useMemo(() => documentForServer(specification.document, server), [specification, server]);
  return <div className={styles.document}>
    <div className={styles.executionServer}><label>{ru ? "Сервер запросов" : "Request server"}</label>
      <AnimatedSelect label={ru ? "Сервер запросов" : "Request server"} value={server} onChange={setServer}
        options={[{ value: "", label: ru ? "Выберите сервер для выполнения запросов" : "Choose a server to send requests" }, ...servers.map(url => ({ value: url, label: url }))]}/>
    </div>
    <SwaggerUI key={server} spec={document} queryConfigEnabled={false} withCredentials={false} persistAuthorization={false}
      supportedSubmitMethods={server ? ["get", "put", "post", "delete", "options", "head", "patch", "trace"] : []}
      docExpansion="list" filter displayRequestDuration defaultModelsExpandDepth={-1}
      requestInterceptor={(request) => {
        const url = String(request.url ?? ""); requireSelectedServer(url, server);
        return authorizeSwaggerRequest({ ...request, url }, window.location.origin);
      }} />
  </div>;
}
