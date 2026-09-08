"use client";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import type { SwaggerSpecification } from "../../../connectors/model/swagger/swagger-specification";
import { authorizeSwaggerRequest } from "./swagger-request-policy";
import styles from "./swagger-document.module.css";
export default function SwaggerDocument({ specification }: { specification: SwaggerSpecification }) {
  return <div className={styles.document}>
    <SwaggerUI spec={specification.document} queryConfigEnabled={false} withCredentials={false} persistAuthorization={false}
      docExpansion="list" filter displayRequestDuration defaultModelsExpandDepth={-1}
      requestInterceptor={(request) => authorizeSwaggerRequest({ ...request, url: String(request.url ?? "") }, window.location.origin)} />
  </div>;
}
