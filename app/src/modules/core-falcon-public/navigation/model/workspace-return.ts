import { isWorkspacePath } from "../../../core-tms/navigation/workspace-route";
import { tmsReturnPathFromLocation } from "../../../core-tms/auth/navigation/tms-auth-route";

export const PUBLIC_WORKSPACE_RETURN_KEY = "falcon.public.workspace-return.v1";

/** Only an existing same-origin workspace can be a public page's return target. */
export function workspaceReturnPath(candidate: unknown, origin: string): string | null {
  if (typeof candidate !== "string" || !candidate || candidate.length > 8192
    || candidate.startsWith("//") || /[\\\x00-\x20\x7f]/.test(candidate) || /%0[ad]/i.test(candidate)) return null;
  try {
    const url = new URL(candidate, origin);
    if (url.origin !== origin || url.username || url.password || !isWorkspacePath(url.pathname)) return null;
    return tmsReturnPathFromLocation(url);
  } catch { return null; }
}
