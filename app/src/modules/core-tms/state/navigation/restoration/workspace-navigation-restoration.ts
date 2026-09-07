import type { View } from "../../types/workspace";

type Selection = Readonly<{
  workspaceId: string;
  projectId: string;
  view: View;
  runId: string | null;
  caseId: string;
}>;

export class WorkspaceNavigationRestoration {
  private pending: Selection | null = null;

  begin(selection: Selection) {
    this.pending = selection;
  }

  cancel() {
    this.pending = null;
  }

  canWrite(selection: Selection) {
    const pending = this.pending;
    if (!pending) return true;
    if (pending.workspaceId !== selection.workspaceId || pending.projectId !== selection.projectId
      || pending.view !== selection.view || pending.runId !== selection.runId
      || pending.caseId !== selection.caseId) return false;
    this.pending = null;
    return true;
  }
}
