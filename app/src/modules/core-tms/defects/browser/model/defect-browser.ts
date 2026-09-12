import type { Defect } from "../../../../../core/tms/contracts/legacy-contract";

export type BrowserStatus = "idle" | "loading" | "ready" | "error";
export interface DefectCounts { total: number; open: number; critical: number }
export interface DefectGroup extends DefectCounts { component: string }
export interface DefectBranch {
  items: Defect[]; status: BrowserStatus; error: string | null; hasMore: boolean;
}
export interface DefectBrowserQuery {
  projectId: string; q: string; severitySort?: "asc" | "desc" | null;
}
export interface DefectGroupPage {
  groups: DefectGroup[]; totals: DefectCounts; groupCount: number; nextCursor: string | null;
}
export interface DefectBrowserSource {
  groups(query: DefectBrowserQuery, cursor: string | null, signal: AbortSignal): Promise<DefectGroupPage>;
  records(query: DefectBrowserQuery, component: string, cursor: string | null, signal: AbortSignal):
    Promise<{ items: Defect[]; nextCursor: string | null }>;
}
export interface DefectBrowserState {
  key: string; groups: DefectGroup[]; totals: DefectCounts | null; groupCount: number | null;
  groupsStatus: BrowserStatus; groupsError: string | null; hasMoreGroups: boolean;
  branches: Record<string, DefectBranch>;
}
export const emptyDefectBrowser = (key = ""): DefectBrowserState => ({ key, groups: [], totals: null,
  groupCount: null, groupsStatus: "idle", groupsError: null, hasMoreGroups: false, branches: Object.create(null) as Record<string, DefectBranch> });
