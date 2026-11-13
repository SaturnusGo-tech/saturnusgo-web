import { requestAuthoringLeave } from "../../../authoring/leave/application/authoring-leave";
import type { CaseInspectorEditor } from "../inspector/model";

type InspectorLeave = {
  editor?: CaseInspectorEditor;
  selectedCaseId: string;
  onSelectCase: (id: string) => void;
  setDetailFullscreen: (open: boolean) => void;
  setDetailOpen: (open: boolean) => void;
  animate?: (leave: () => void) => void | Promise<void>;
};

export function leaveCaseInspector(options: InspectorLeave) {
  if (options.editor?.submitting) return Promise.resolve(false);
  return requestAuthoringLeave(commit => {
    const leave = () => {
      const restorePrevious = options.editor?.mode === "create" && Boolean(options.selectedCaseId);
      options.editor?.onCancel();
      if (!restorePrevious) options.onSelectCase("");
      options.setDetailFullscreen(false);
      options.setDetailOpen(restorePrevious);
    };
    if (options.animate) return options.animate(() => commit(leave));
    commit(leave);
  });
}
