export const CASE_INSPECTOR_DEFAULT = 680;
export const CASE_INSPECTOR_MIN = 520;
export const CASE_INSPECTOR_MAX = 820;
export const CASE_LIST_MIN = 440;

export function clampCaseInspectorPreference(value: number) {
  return Math.round(Math.min(Math.max(value, CASE_INSPECTOR_MIN), CASE_INSPECTOR_MAX));
}

export function resolveCaseInspectorWidth(preference: number, containerWidth: number) {
  const preferred = clampCaseInspectorPreference(preference);
  if (containerWidth <= 0) return preferred;
  if (containerWidth < CASE_INSPECTOR_MIN + CASE_LIST_MIN) {
    return Math.round(Math.min(preferred, containerWidth));
  }
  return Math.round(Math.min(preferred, containerWidth - CASE_LIST_MIN));
}
