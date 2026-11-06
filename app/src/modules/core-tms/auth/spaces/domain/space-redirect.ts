import { companyAddress } from "../../../../core-falcon-public/company-entry/domain/company-address";
import type { AccountSpace } from "./account-spaces";
import { isWorkspacePath, WORKSPACE_PATH } from "../../../navigation/workspace-route";
const scopedId = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
function validQuery(target: URL, allowed: readonly string[]): boolean {
  return [...target.searchParams].every(([key, value]) => target.searchParams.getAll(key).length === 1 && allowed.includes(key)
    && (key === "desktopAttempt" ? /^[A-Za-z0-9_-]{43}$/.test(value) : key === "workspaceHandoff" ? value === "1" : scopedId.test(value)));
}
export function spaceRedirect(candidate: string, origin: string, kind: AccountSpace["kind"], suffix = "saturnusgo.com"): string | null {
  try {
    if (candidate.length > 4096) return null;
    const target = new URL(candidate);
    if (target.protocol !== "https:" || target.username || target.password || target.hash) return null;
    if (kind === "personal") {
      if (target.origin !== origin || !isWorkspacePath(target.pathname) || !validQuery(target, ["desktopAttempt"])) return null;
      const destination = new URL(WORKSPACE_PATH, target.origin); destination.search = target.search; return destination.href;
    }
    if (!companyAddress(target.origin, suffix) && target.origin !== origin) return null;
    if (target.searchParams.has("workspaceHandoff")) return target.origin === origin && target.pathname === "/cloud-login/"
      && target.searchParams.has("workspaceId") && validQuery(target, ["workspaceId", "workspaceHandoff", "desktopAttempt"]) ? target.href : null;
    const saml = /^\/api\/v1\/auth\/saml\/([^/]+)\/launch$/.exec(target.pathname);
    if (saml ? !scopedId.test(decodeURIComponent(saml[1])) : !["/cloud-login/", "/api/v1/auth/google/launch"].includes(target.pathname)) return null;
    if (!validQuery(target, ["workspaceId", "desktopAttempt"])) return null;
    if (!saml && (target.origin === origin || target.pathname === "/cloud-login/") && !target.searchParams.has("workspaceId")) return null;
    return target.href;
  } catch { return null; }
}
