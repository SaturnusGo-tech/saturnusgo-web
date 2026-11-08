import { useRef, useState } from "react";
import { useTmsHttpClient } from "../../../../auth/http/TmsHttpClientContext";
import { buildDefectDeepLink } from "../../../../defects/navigation/defect-deep-link";
import type { WorkspaceModel } from "../../../../state/model/useWorkspaceModel";
import { visitWorkspace } from "../../../../state/navigation/browser/workspace-history";
import { useRunActions } from "../../../../state/run-actions/useRunActions";
import { useRunArchive } from "../../../../state/run-archive/useRunArchive";
import { useSelectedRunResource } from "../../../../state/run-resource/useSelectedRunResource";
import { useRunStart } from "../../../../state/run-start/useRunStart";

export type ProductDocRunSelection = { runId: string; projectId: string; trigger: HTMLElement };

const keepRunScope = () => {};

export function useProductDocRunModel(model: WorkspaceModel, { runId, projectId }: ProductDocRunSelection): WorkspaceModel {
  const http = useTmsHttpClient();
  const [selectedRunItemId, setSelectedRunItemId] = useState<string | null>(null);
  const resource = useSelectedRunResource({ http, connection: model.connection, projectId,
    selectedRunId: runId, selectedRunItemId, setSelectedRunItemId, setData: model.setData });
  const confirmedItems = useRef<typeof resource.runItems | undefined>(undefined);
  if (resource.runResourceReady) confirmedItems.current = resource.runItems;
  const state = {
    ...model, ...resource, runItems: confirmedItems.current ?? resource.runItems, projectId, selectedRunId: runId, selectedRunItemId, setSelectedRunItemId,
    setProjectId: keepRunScope, setSelectedRunId: keepRunScope,
  };
  const projectRuns = model.data.runs.filter(run => run.projectId === projectId);
  const selectedRun = confirmedItems.current ? projectRuns.find(run => run.id === runId) ?? null : null;
  const selectedRunItem = resource.selectedRunItemDetail?.id === selectedRunItemId ? resource.selectedRunItemDetail : null;
  const scopedRun = { projectRuns, selectedRun, selectedRunItem,
    project: model.data.projects.find(project => project.id === projectId),
    projectCases: model.data.testCases.filter(testCase => testCase.projectId === projectId),
  };
  const derived = { ...model, ...scopedRun };
  const actions = useRunActions(state, derived, model.notify);
  const archive = useRunArchive(state, derived, model.notify);
  const start = useRunStart(state, derived);
  function openDefect(defectId: string) {
    visitWorkspace(buildDefectDeepLink(window.location.href, { projectId, defectId }));
  }
  return { ...state, ...scopedRun, ...actions, ...archive, ...start, openDefect };
}
