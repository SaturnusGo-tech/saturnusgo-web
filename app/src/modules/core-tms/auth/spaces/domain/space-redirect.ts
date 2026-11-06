import { companyAddress } from "../../../../core-falcon-public/company-entry/domain/company-address";
import type { AccountSpace } from "./account-spaces";
import { isWorkspacePath, WORKSPACE_PATH } from "../../../navigation/workspace-route";
export function spaceRedirect(candidate: string, origin: string, kind: AccountSpace["kind"], suffix = "saturnusgo.com"): string | null {
  try {
    if (candidate.length > 4096) return null;
    const target = new URL(candidate);
    if (target.protocol !== "https:" || target.username || target.password || target.hash) return null;
    if (kind === "personal") return !target.search && target.origin === origin && isWorkspacePath(target.pathname) ? new URL(WORKSPACE_PATH, target.origin).href : null;
    if (!companyAddress(target.origin, suffix) && target.origin !== origin) return null;
    const scopedId = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
    const saml = /^\/api\/v1\/auth\/saml\/([^/]+)\/launch$/.exec(target.pathname);
    if (saml ? !scopedId.test(decodeURIComponent(saml[1])) : !["/cloud-login/", "/api/v1/auth/google/launch"].includes(target.pathname)) return null;
    for (const [key, value] of target.searchParams) {
      if (target.searchParams.getAll(key).length !== 1 || !["workspaceId", "desktopAttempt"].includes(key)
        || (key === "desktopAttempt" ? !/^[A-Za-z0-9_-]{43}$/.test(value) : !scopedId.test(value))) return null;
    }
    if (!saml && (target.origin === origin || target.pathname === "/cloud-login/") && !target.searchParams.has("workspaceId")) return null;
    return target.href;
  } catch { return null; }
}
