import { useCaseActions } from "../case-actions/useCaseActions";
import { useRunActions } from "../run-actions/useRunActions";
import { useRunArchive } from "../run-archive/useRunArchive";
import { useWorkspaceActions } from "../workspace-actions/useWorkspaceActions";
import { useWorkspaceDerived } from "../workspace-derived/useWorkspaceDerived";
import { useWorkspaceResourceActions } from "../workspace-resources/useWorkspaceResourceActions";
import { useWorkspaceState } from "../workspace/useWorkspaceState";
import { useCaseBulkActions } from "../case-bulk/useCaseBulkActions";

export function useWorkspaceModel() {
  const state = useWorkspaceState();
  const derived = useWorkspaceDerived(state);
  const workspace = useWorkspaceActions(state, derived);
  const resources = useWorkspaceResourceActions(
    state,
    derived,
    workspace.notify,
  );
  const cases = useCaseActions(state, derived, workspace.notify);
  const runs = useRunActions(state, derived, workspace.notify);
  const runArchive = useRunArchive(state, derived, workspace.notify);
  const caseBulk = useCaseBulkActions(state, derived, workspace.notify);
  return {
    ...state,
    ...derived,
    ...workspace,
    ...resources,
    ...cases,
    ...runs,
    ...runArchive,
    ...caseBulk,
  };
}

export type WorkspaceModel = ReturnType<typeof useWorkspaceModel>;
