import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { usePortfolioCommand } from "../../state/command/usePortfolioCommand";
import { patchOrganization } from "../data/organization-api";
import { validChecklist, type OrganizationPatch, type OrganizationTarget } from "../model/organization";
type Saved = Awaited<ReturnType<typeof patchOrganization>>;
export function useOrganizationManagement(target: OrganizationTarget, current: { etag: string | null; data: { status?: string } } | null,
  canManage: boolean, onSaved: (result: Saved) => void, reload: () => void) {
  const http = useTmsHttpClient();
  const command = usePortfolioCommand(`${target.workspaceId}:${target.targetType}:${target.targetId}`);
  async function save(patch: OrganizationPatch) {
    if (!canManage || !current?.etag || current.data.status === "archived" || patch.checklist && !validChecklist(patch.checklist)) return false;
    const result = await command.run(JSON.stringify({ etag: current.etag, patch }), (key, signal) =>
      patchOrganization(http, target, patch, current.etag!, key, signal));
    if (!result) return false;
    onSaved(result);
    return true;
  }
  return { ...command, save, reload, disabled: command.pending || !canManage || !current?.etag || current.data.status === "archived" };
}
