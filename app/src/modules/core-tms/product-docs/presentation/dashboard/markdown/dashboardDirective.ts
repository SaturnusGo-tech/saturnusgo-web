import type { LeafDirective } from "mdast-util-directive";

export const dashboardDirectiveName = "falcon-dashboard";
export const dashboardSnapshotPattern = /^dsh_[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;

export function markProductDocDashboard(node: LeafDirective): boolean {
  if (node.name !== dashboardDirectiveName) return false;
  const snapshot = node.attributes?.snapshot;
  node.data = {
    ...node.data,
    hName: dashboardDirectiveName,
    hProperties: { snapshot: snapshot && dashboardSnapshotPattern.test(snapshot) ? snapshot : "" },
    hChildren: [],
  };
  return true;
}
