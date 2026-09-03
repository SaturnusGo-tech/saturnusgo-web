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
    derived.project?.id ?? "", state.setView,
  );
  const selectedDefectResource = useSelectedDefectResource(
    state.connection === "connected", derived.project?.id ?? "", derived.projectDefects,
    defectNavigation.selectedDefectId,
  );
  const sharedSteps = useSharedSteps(derived.project?.id ?? "", state.connection);
  useEffect(() => {
    if (selectedDefectResource.status === "ready"
      && selectedDefectResource.data?.projectId === derived.project?.id) {
      defectNavigation.canonicalizeSelectedDefect();
    }
  }, [defectNavigation.canonicalizeSelectedDefect, derived.project?.id,
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
    reportDefects,
    selectedDefectResource,
    sharedSteps,
  };
}

export type WorkspaceModel = ReturnType<typeof useWorkspaceModel>;
