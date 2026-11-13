import type { DefectDraft, DefectDraftErrors } from "../model";

export function validateDefectDraft(draft: DefectDraft, ru: boolean): DefectDraftErrors {
  const errors: DefectDraftErrors = {};
  if (!draft.title.trim()) errors.title = ru ? "Укажите название дефекта." : "Enter a defect title.";
  if (!draft.actualResult.trim()) errors.actualResult = ru ? "Опишите фактический результат." : "Describe the actual result.";
  return errors;
}
