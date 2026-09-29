/** Show a confirmed action, or progress for an action that is already underway. */
export function showVerificationControl(state: {
  enabled: boolean; canStart: boolean; data: { totalCases: number } | null;
  pending: boolean; pendingStart: boolean; unresolved: boolean; error: string; disabledReason: string;
}): boolean {
  if (!state.enabled || !state.canStart) return false;
  if (state.pendingStart) return true;
  if (state.disabledReason) return false;
  // Recovery repeats a real operation, even if its successful server response was lost.
  if (state.unresolved) return true;
  if (state.pending || state.error) return false;
  const count = state.data?.totalCases ?? 0;
  return Number.isSafeInteger(count) && count > 0;
}
