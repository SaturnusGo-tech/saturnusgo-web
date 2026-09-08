/** Keep interrupted run creation recoverable even after its defects leave the queue. */
export function showVerificationControl(state: {
  enabled: boolean; data: { totalCases: number } | null;
  unresolved: boolean; pendingStart: boolean; error: string;
}): boolean {
  if (!state.enabled) return false;
  if (state.unresolved || state.pendingStart) return true;
  if (state.data) return state.data.totalCases > 0;
  return Boolean(state.error);
}
