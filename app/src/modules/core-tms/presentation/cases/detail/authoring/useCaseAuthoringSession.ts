import { useId, useRef } from "react";
import { useAuthoringSession } from "../../../../authoring/leave/state/useAuthoringSession";
import type { PendingCaseAttachment } from "../../../../application/evidence/case/pendingCaseAttachment";
import type { CaseInspectorEditor } from "../../inspector/model";

export function useCaseAuthoringSession(editor?: CaseInspectorEditor, files: readonly PendingCaseAttachment[] = []) {
  const instance = useId();
  const session = useRef({ sequence: 0, baseline: "", open: false, key: "" });
  const snapshot = editor ? JSON.stringify([editor.value, editor.folderPath, editor.documentation?.value ?? []]) : "";
  if (editor && (!session.current.open || session.current.key !== (editor.sessionId ?? editor.mode))) {
    session.current = { sequence: session.current.sequence + 1, baseline: snapshot, open: true, key: editor.sessionId ?? editor.mode };
  } else if (!editor) session.current.open = false;
  return useAuthoringSession({
    id: `case-editor:${instance}:${session.current.sequence}`,
    dirty: Boolean(editor && (snapshot !== session.current.baseline || files.length
      || editor.attachmentsPending || editor.documentationRetry)),
    busy: Boolean(editor?.submitting),
    revision: JSON.stringify([snapshot, files.map(file => file.id), editor?.attachmentsPending, editor?.documentationRetry]),
  });
}
