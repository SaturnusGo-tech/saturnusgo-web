import type { components } from "../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { StartupSetupPort } from "../domain/startup-setup";
type Envelope = components["schemas"]["StartupSetupEnvelope"];
export function createStartupSetupApi(http: TmsHttpClient, locale?: "en" | "ru"): StartupSetupPort {
  return {
    read: async (workspaceId, signal) => (await http.getResource<Envelope["data"]>(`/billing/startup-setup?${new URLSearchParams({ workspaceId })}`, signal)).data.setup,
    save: async (workspaceId, input, expectedVersion, idempotencyKey, signal) => {
      const body = { ...input, ...(locale ? { locale } : {}), workspaceId, expectedVersion, idempotencyKey } satisfies components["schemas"]["StartupSetupRequest"];
      return (await http.mutateResource<Envelope["data"]>("/billing/startup-setup", "PUT", body, { signal, idempotencyKey })).data.setup!;
    },
    retry: async (workspaceId, expectedVersion, idempotencyKey, signal) => (await http.mutateResource<Envelope["data"]>("/billing/startup-setup/retry", "POST",
      { workspaceId, expectedVersion, idempotencyKey } satisfies components["schemas"]["StartupSetupRetryRequest"], { signal, idempotencyKey })).data.setup!,
  };
}
