import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { getEnvironment } from "../../environments/data/environment-api";

export const readEnvironmentForEdit = (http: TmsHttpClient, id: string) => getEnvironment(http, id);
