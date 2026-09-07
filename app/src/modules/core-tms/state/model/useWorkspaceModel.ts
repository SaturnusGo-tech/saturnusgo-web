import { useEffect } from "react";
import { useCaseActions } from "../case-actions/useCaseActions";
import { useRunActions } from "../run-actions/useRunActions";
import { useRunArchive } from "../run-archive/useRunArchive";
import { useWorkspaceActions } from "../workspace-actions/useWorkspaceActions";
import { useWorkspaceDerived } from "../workspace-derived/useWorkspaceDerived";
import { useWorkspaceResourceActions } from "../workspace-resources/useWorkspaceResourceActions";
import { useWorkspaceState } from "../workspace/useWorkspaceState";
import { useCaseBulkActions } from "../case-bulk/useCaseBulkActions";
import { useCaseCollaboration } from "../case-collaboration/useCaseCollaboration";
import { useDefectNavigation } from "../defect-navigation/useDefectNavigation";
import { useSelectedDefectResource } from "../defect-resource/useSelectedDefectResource";
import { useRunNavigation } from "../run-navigation/useRunNavigation";
import { useSharedSteps } from "../../shared-steps/state/useSharedSteps";

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
  const capabilities = state.data.meta.authorization.capabilities;
  const caseCollaboration = useCaseCollaboration({
    active: state.view === "cases",
    connected: state.connection === "connected",
    projectId: derived.project?.id ?? "",
    caseId: derived.selectedCase?.id ?? "",
    canComment: capabilities.includes("test_case:manage"),
    canConfirmFix: capabilities.includes("defect:manage")
      && capabilities.includes("run:execute"),
  });
  const defectNavigation = useDefectNavigation(
    state.projectId, state.setView, state.canWriteNavigation,
  );
  const openRun = useRunNavigation({ workspaceId: state.data.workspace.id, projectId: state.projectId,
    setSelectedRunId: state.setSelectedRunId, setSelectedRunItemId: state.setSelectedRunItemId,
    setView: state.setView, clearDefectSelection: defectNavigation.clearDefectSelection });
  const selectedDefectResource = useSelectedDefectResource(
    state.connection === "connected", derived.project?.id ?? "", derived.projectDefects,
    defectNavigation.selectedDefectId,
  );
  const sharedSteps = useSharedSteps(derived.project?.id ?? "", state.connection);
  useEffect(() => {
    if (state.canWriteNavigation() && state.view === "reports" && selectedDefectResource.status === "ready"
      && selectedDefectResource.data?.projectId === derived.project?.id) {
      defectNavigation.canonicalizeSelectedDefect();
    }
  }, [state.view, state.canWriteNavigation, defectNavigation.canonicalizeSelectedDefect, derived.project?.id,
    selectedDefectResource.data?.projectId, selectedDefectResource.status]);
  const selectedDefect = selectedDefectResource.data;
  const reportDefects = selectedDefect
    && !derived.projectDefects.some((defect) => defect.id === selectedDefect.id)
    ? [...derived.projectDefects, selectedDefect] : derived.projectDefects;
  return {
    ...state,
    ...derived,
    ...workspace,
    ...resources,
    ...cases,
    ...runs,
    ...runArchive,
    ...caseBulk,
    caseCollaboration,
    ...defectNavigation,
    openRun,
    reportDefects,
    selectedDefectResource,
    sharedSteps,
    canManageIntegrations: capabilities.includes("integration:manage"),
  };
}

export type WorkspaceModel = ReturnType<typeof useWorkspaceModel>;
