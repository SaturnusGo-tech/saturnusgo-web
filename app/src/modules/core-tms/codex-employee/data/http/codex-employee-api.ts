import type { components } from "../../../../../core/tms/generated/tms-api";
import { TmsApiError, type TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { CodexEmployeePort, PersonalCodexConnection } from "../../domain/model/codex-employee";
export function createCodexEmployeeApi(http: TmsHttpClient): CodexEmployeePort {
    return {
        async status(signal) {
            const result = await http.getResource<components["schemas"]["CodexEmployeeStatus"]>("/company/agents/codex", signal);
            const { provider, status, identityId, rowVersion, capacity, canManage, canActivate, canDeactivate, canConnect, connectUrl, setup } = result.data;
            return { provider, status, identityId, rowVersion, capacity: { ...capacity }, canManage, canActivate, canDeactivate, canConnect, connectUrl, setup: { ...setup, scopes: [...setup.scopes] }, etag: result.etag };
        },
        async connections(signal, workspaceId) {
            const result: PersonalCodexConnection[] = [];
            const query = workspaceId ? new URLSearchParams({ workspaceId, limit: "100" }) : null;
            const seen = new Set<string>();
            for (;;) {
                const page = await http.get<{ data: PersonalCodexConnection[]; meta?: { nextCursor?: string | null } }>(
                    query ? `/profile/mcp-connections?${query}` : "/profile/mcp-connections", signal);
                result.push(...page.data.map(row => ({ ...row, projectIds: [...row.projectIds], scopes: [...row.scopes] })));
                const next = page.meta?.nextCursor;
                if (!query || !next) return result;
                if (seen.has(next)) throw new Error("Invalid Falcon MCP connection cursor");
                seen.add(next);
                query.set("cursor", next);
            }
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
