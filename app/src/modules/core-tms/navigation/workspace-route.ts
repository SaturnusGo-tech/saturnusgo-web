export const WORKSPACE_PATH = "/work/";
export const LEGACY_WORKSPACE_PATH = "/testcases/umbrella-home/work/";
export function isWorkspacePath(pathname: string): boolean {
  return pathname === WORKSPACE_PATH || pathname === LEGACY_WORKSPACE_PATH;
}
export function canonicalWorkspacePathname(pathname: string): string {
  return isWorkspacePath(pathname) ? WORKSPACE_PATH : pathname;
}
