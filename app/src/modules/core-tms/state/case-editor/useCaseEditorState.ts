import { useRef, useState } from "react";
import type { TestCaseRevision } from "../../../../core/tms/contracts/legacy-contract";
import { createEmptyRevision } from "../../helpers/cases/caseRevision";
import type { TmsLocale } from "../../localization/model/locale";

export function useCaseEditorState(locale: TmsLocale, closeEditor: () => void) {
  const [editing, setEditing] = useState(false);
  const [caseDraft, setCaseDraft] = useState<TestCaseRevision>(() => createEmptyRevision(locale));
  const [caseSubmitting, setCaseSubmitting] = useState(false);
  const caseSubmittingRef = useRef(false);
  const [caseFolderPath, setCaseFolderPath] = useState("/Unsorted");

  function resetCaseEditor(folderPath = "/Unsorted") {
    closeEditor();
    setEditing(false);
    setCaseSubmitting(false);
    setCaseDraft(createEmptyRevision(locale));
    setCaseFolderPath(folderPath);
  }

  function beginCaseSubmission() {
    if (caseSubmittingRef.current) return false;
    caseSubmittingRef.current = true;
    setCaseSubmitting(true);
    return true;
  }

  function finishCaseSubmission() {
    caseSubmittingRef.current = false;
    setCaseSubmitting(false);
  }

  return {
    editing, setEditing, caseDraft, setCaseDraft, caseSubmitting,
    caseFolderPath, setCaseFolderPath, resetCaseEditor, beginCaseSubmission,
    finishCaseSubmission, isCaseSubmitting: () => caseSubmittingRef.current,
  };
}
