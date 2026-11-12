import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import { createWorkspaceCapabilityReader } from "../../../../auth/spaces/capabilities/data/workspace-capability-api";
import type { WorkspaceCapabilities } from "../../../../auth/spaces/capabilities/domain/workspace-capabilities";
import { createCodexEmployeeApi } from "../../../../codex-employee/data/http/codex-employee-api";
import type { PersonalCodexConnection } from "../../../../codex-employee/domain/model/codex-employee";
import { pluginSettingsLink } from "../../../../presentation/config/navigation/plugins/plugin-settings-route";

export type ImportCodexSnapshot = Readonly<{ setup: WorkspaceCapabilities; connections: readonly PersonalCodexConnection[] }>;
export type ImportCodexState = Readonly<{ status: "ready" | "limited" | "available" | "unavailable" | "checking" | "unknown";
  pluginUrl: string | null; canConnect: boolean; canUpload: boolean; canExport: boolean }>;
const required = ["falcon:read", "falcon:cases:create", "falcon:repository:write"] as const;

export async function loadImportCodexConnection(http: TmsHttpClient, workspaceId: string, signal: AbortSignal): Promise<ImportCodexSnapshot> {
  const [setup, connections] = await Promise.all([createWorkspaceCapabilityReader(http)(workspaceId, signal),
    createCodexEmployeeApi(http).connections(signal, workspaceId)]);
  signal.throwIfAborted();
  return { setup, connections };
}

export function importCodexConnection(snapshot: ImportCodexSnapshot, projectId: string, canManage: boolean, now = Date.now()): ImportCodexState {
  const { setup } = snapshot;
  const pluginUrl = setup.installation.pluginUrl;
  const installation = pluginUrl && /^https:\/\/chatgpt\.com\/plugins\/[A-Za-z0-9_-]+$/.test(pluginUrl) ? pluginUrl : null;
  const available = setup.status !== "unavailable";
  const grants = available ? snapshot.connections.filter(grant => !grant.revokedAt && Date.parse(grant.expiresAt) > now
    && grant.projectIds.includes(projectId) && grant.scopes.includes("falcon:read")) : [];
  const writers = canManage && !setup.readOnly && setup.canConnect ? grants.filter(grant => required.every(scope => grant.scopes.includes(scope))) : [];
  return { status: !available ? "unavailable" : writers.length ? "ready" : grants.length ? "limited" : "available",
    pluginUrl: installation, canConnect: available && setup.canConnect,
    canUpload: writers.some(grant => grant.scopes.includes("falcon:attachments:write")), canExport: grants.length > 0 };
}

export function importCodexSetupLink(href: string, workspaceId: string, projectId: string): string {
  const url = new URL(href);
  url.searchParams.set("workspaceId", workspaceId); url.searchParams.set("projectId", projectId);
  return pluginSettingsLink(url.href, "codex", true);
}
