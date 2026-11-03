import type { components } from "../../../../../core/tms/generated/tms-api";
export type MaintenanceSource = Readonly<components["schemas"]["CaseMaintenanceSource"]>;
export type CaseMaintenance = Readonly<components["schemas"]["CaseMaintenance"]>;
export type MaintenanceChange = components["schemas"]["CaseMaintenanceChange"];
export function mergeMaintenance<T extends { id: string; maintenance?: CaseMaintenance }>(item: T, caseId: string, projection: CaseMaintenance): T {
  return item.id !== caseId || (item.maintenance?.rowVersion ?? 0) >= projection.rowVersion ? item : { ...item, maintenance: projection };
}

/** Refreshing case content must not roll back independently versioned maintenance metadata. */
export function reconcileMaintenance<T extends { id: string; projectId: string; maintenance?: CaseMaintenance }>(incoming: T,
  known: { id: string; projectId: string; maintenance?: CaseMaintenance } | null | undefined): T {
  return known?.id === incoming.id && known.projectId === incoming.projectId && known.maintenance &&
    known.maintenance.rowVersion > (incoming.maintenance?.rowVersion ?? 0) ? { ...incoming, maintenance: known.maintenance } : incoming;
}
