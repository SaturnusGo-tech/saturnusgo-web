import type { components } from "../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { TdmConfiguration } from "../../model/configuration/configuration";
export function createConfigurationClient(http: TmsHttpClient, base: string) {
  return async (signal: AbortSignal): Promise<TdmConfiguration> => {
    const { data } = await http.getResource<components["schemas"]["TdmConfiguration"]>(`${base}/configuration`, signal);
    return { enabled: data.enabled, credentialsAvailable: data.credentialsAvailable, revealVerificationAvailable: data.revealVerificationAvailable,
      permissions: [...data.permissions], limits: { ...data.limits } };
  };
}
