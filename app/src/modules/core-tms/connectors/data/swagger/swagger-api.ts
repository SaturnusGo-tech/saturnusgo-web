import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { Scope } from "../../model/connector-types";
import type { SwaggerSpecification } from "../../model/swagger/swagger-specification";
export const loadSwaggerSpecification = async (http: TmsHttpClient, scope: Scope, signal: AbortSignal) =>
  (await http.get<{ data: SwaggerSpecification }>(
    `/integrations/connectors/swagger/specification?${new URLSearchParams(scope)}`, signal)).data;
