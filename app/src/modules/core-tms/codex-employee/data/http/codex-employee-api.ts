import type { components } from "../../../../../core/tms/generated/tms-api";
import { TmsApiError, type TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { CodexEmployeePort, PersonalCodexConnection } from "../../domain/model/codex-employee";
export function createCodexEmployeeApi(http: TmsHttpClient): CodexEmployeePort {
    return {
        async status(signal) {
            const result = await http.getResource<components["schemas"]["CodexEmployeeStatus"]>("/company/agents/codex", signal);
            const { provider, status, identityId, rowVersion, capacity, canActivate, canDeactivate, canConnect, connectUrl } = result.data;
            return { provider, status, identityId, rowVersion, capacity: { ...capacity }, canActivate, canDeactivate, canConnect, connectUrl, etag: result.etag };
        },
        async connections(signal) {
            const result = await http.get<{
                data: components["schemas"]["FalconMcpConnection"][];
            }>("/profile/mcp-connections", signal);
            return result.data.map((row): PersonalCodexConnection => ({ ...row, projectIds: [...row.projectIds], scopes: [...row.scopes] }));
        },
        async deactivate(employee, commandId, signal) {
            if (!employee.canDeactivate || !employee.etag)
                throw new TmsApiError("Company action unavailable", 403, null, "FORBIDDEN");
            await http.mutateResource("/company/agents/codex/deactivate", "POST", {}, { signal, ifMatch: employee.etag, idempotencyKey: commandId });
        },
        async revoke(grantId, signal) {
            await http.mutateResource(`/profile/mcp-connections/${encodeURIComponent(grantId)}/revoke`, "POST", {}, { signal });
        },
    };
}
