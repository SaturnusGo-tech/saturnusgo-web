import { useWorkspaceActor } from "./actors/useWorkspaceActor";
export function useMemberName(workspaceId: string, identityId: string | null, offline: boolean) {
  const state = useWorkspaceActor(workspaceId, identityId, offline);
  return { ...state, name: state.actor?.name ?? null };
}
