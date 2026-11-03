import type { components } from "../../../../../core/tms/generated/tms-api";
import { TmsApiError, type TmsHttpClient } from "../../../../../core/tms/transport/http";
import { AdministrationError } from "../../../company-administration/domain/administration";
import type { CompanyCodexAdminPort } from "../../domain/admin/company-codex-admin";

export function createCompanyCodexAdminApi(http: TmsHttpClient): CompanyCodexAdminPort {
  async function call<T>(operation: () => Promise<T>): Promise<T> {
    try { return await operation(); } catch (error) {
      if (error instanceof TmsApiError) throw new AdministrationError(error.code, error.requestId);
      throw error;
    }
  }
  const path = "/company/agents/codex";
  return {
    connections: (status, cursor, signal) => call(async () => {
      const query = new URLSearchParams({ limit: "20", status, ...(cursor ? { cursor } : {}) });
      const page = await http.get<components["schemas"]["CompanyCodexConnectionPage"]>(`${path}/connections?${query}`, signal);
      return { items: page.data, nextCursor: page.page.nextCursor };
    }),
    activate: (employee, key, signal) => call(async () => {
      await http.mutateResource<components["schemas"]["CodexEmployeeActivation"]>(`${path}/activate`, "POST", {},
        { signal, idempotencyKey: key, ...(employee.etag ? { ifMatch: employee.etag } : {}) });
    }),
    deactivate: (employee, key, signal) => call(async () => {
      await http.mutateResource(`${path}/deactivate`, "POST", {}, { signal, idempotencyKey: key, ...(employee.etag ? { ifMatch: employee.etag } : {}) });
    }),
    revoke: (id, key, signal) => call(async () => {
      await http.mutateResource(`${path}/connections/${encodeURIComponent(id)}/revoke`, "POST", {}, { signal, idempotencyKey: key });
    }),
  };
}
