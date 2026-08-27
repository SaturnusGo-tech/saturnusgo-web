import { useCaseActions } from "../case-actions/useCaseActions";
import { useRunActions } from "../run-actions/useRunActions";
import { useWorkspaceActions } from "../workspace-actions/useWorkspaceActions";
import { useWorkspaceDerived } from "../workspace-derived/useWorkspaceDerived";
import { useWorkspaceState } from "../workspace/useWorkspaceState";

export function useWorkspaceModel() {
  const state = useWorkspaceState();
  const derived = useWorkspaceDerived(state);
  const workspace = useWorkspaceActions(state, derived);
  const cases = useCaseActions(state, derived, workspace.notify);
  const runs = useRunActions(state, derived, workspace.notify);
  return { ...state, ...derived, ...workspace, ...cases, ...runs };
}

export type WorkspaceModel = ReturnType<typeof useWorkspaceModel>;
