import { companyAddress } from "../../../../core-falcon-public/company-entry/domain/company-address";
import type { AccountSpace } from "./account-spaces";
export function spaceRedirect(candidate: string, origin: string, kind: AccountSpace["kind"], suffix = "saturnusgo.com"): string | null {
  try {
    if (candidate.length > 4096) return null;
    const target = new URL(candidate);
    if (target.protocol !== "https:" || target.username || target.password || target.search || target.hash) return null;
    if (kind === "personal") return target.origin === origin && target.pathname === "/testcases/umbrella-home/work/" ? target.href : null;
    return companyAddress(target.origin, suffix) && target.pathname === "/api/v1/auth/google/launch" ? target.href : null;
  } catch { return null; }
}
