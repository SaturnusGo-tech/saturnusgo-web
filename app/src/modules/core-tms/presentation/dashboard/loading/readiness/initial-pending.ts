type SnapshotReadiness = { snapshot: unknown | null; loading: boolean };
export type DashboardInitialReadiness = {
  layoutPending: boolean;
  preferences: { ready: boolean; stored: boolean };
  analytics: SnapshotReadiness;
  workbench: SnapshotReadiness & { enabled: boolean };
};

export function isDashboardInitialPending({ layoutPending, preferences, analytics, workbench }: DashboardInitialReadiness) {
  return layoutPending || (!preferences.ready && preferences.stored) ||
    (!analytics.snapshot && analytics.loading) ||
    (workbench.enabled && !workbench.snapshot && workbench.loading);
}
