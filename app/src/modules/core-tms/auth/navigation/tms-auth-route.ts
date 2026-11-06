import { isWorkspacePath, WORKSPACE_PATH } from "../../navigation/workspace-route";
export const TMS_AUTH_ROUTE_PATH = WORKSPACE_PATH;
export const TMS_ADMIN_LOGIN_PATH = `${TMS_AUTH_ROUTE_PATH}?auth=admin`;
export const TMS_AUTH_LOGOUT_INTENT_KEY = "tms.auth.explicit-logout.v1";
export const TMS_AUTH_PRODUCTION_SIGNED_OUT_URL = "https://tms.saturnusgo.com/cloud-login/";

const authCallbackParameters = [
  "code",
  "state",
  "error",
  "error_description",
  "error_uri",
] as const;

export function shouldUseAdminAuth(search: string): boolean {
  const parameters = new URLSearchParams(search);
  return parameters.get("auth") === "admin"
    || parameters.has("code")
    || parameters.has("state")
    || parameters.has("error");
}

export function tmsAdminLogoutReturnTo(origin: string, locale?: "en" | "ru"): string {
  const destination = new URL(TMS_ADMIN_LOGIN_PATH, origin);
  if (locale) destination.searchParams.set("lang", locale);
  return destination.href;
}

export type TmsLogoutIntentStatus = "checking" | "absent" | "present";

export interface TmsAuthEntrySnapshot {
  readonly isLoading: boolean;
  readonly isAuthenticated: boolean;
  readonly hasError: boolean;
  readonly redirectFailed: boolean;
  readonly logoutIntent: TmsLogoutIntentStatus;
}

export type TmsAuthEntryStage =
  | "checking"
  | "authenticated"
  | "redirect"
  | "exit"
  | "error";

export function resolveTmsAuthEntryStage(
  snapshot: TmsAuthEntrySnapshot,
): TmsAuthEntryStage {
  if (snapshot.logoutIntent === "checking") return "checking";
  if (snapshot.logoutIntent === "present") return "exit";
  if (snapshot.isLoading) return "checking";
  if (snapshot.hasError || snapshot.redirectFailed) return "error";
  if (snapshot.isAuthenticated) return "authenticated";
  return "redirect";
}

export function claimTmsInteractiveLogin(attempt: { current: boolean }): boolean {
  if (attempt.current) return false;
  attempt.current = true;
  return true;
}

export function restoredDuringTmsLogin(
  event: Pick<PageTransitionEvent, "persisted">,
  attempt: { readonly current: boolean },
): boolean {
  return event.persisted && attempt.current;
}

export function tmsReturnPathFromLocation(location: {
  readonly pathname: string;
  readonly search: string;
  readonly hash: string;
}): string {
  const parameters = new URLSearchParams(location.search);
  for (const parameter of authCallbackParameters) parameters.delete(parameter);
  const search = parameters.size > 0 ? `?${parameters.toString()}` : "";
  return safeTmsReturnPath(`${location.pathname}${search}${location.hash}`);
}

export function tmsSignedOutDestination(location: {
  readonly hostname: string;
  readonly origin: string;
}, locale: "en" | "ru" = "en"): string {
  const production = location.hostname === "saturnusgo.com" || location.hostname.endsWith(".saturnusgo.com");
  const destination = new URL(production ? TMS_AUTH_PRODUCTION_SIGNED_OUT_URL : "/cloud-login/", location.origin);
  destination.searchParams.set("lang", locale);
  return destination.href;
}

export function rememberTmsLogoutIntent(
  storage: Pick<Storage, "setItem">,
): void {
  storage.setItem(TMS_AUTH_LOGOUT_INTENT_KEY, "1");
}

export function consumeTmsLogoutIntent(
  storage: Pick<Storage, "getItem" | "removeItem">,
): boolean {
  const present = storage.getItem(TMS_AUTH_LOGOUT_INTENT_KEY) === "1";
  storage.removeItem(TMS_AUTH_LOGOUT_INTENT_KEY);
  return present;
}

export function clearTmsLogoutIntent(
  storage: Pick<Storage, "removeItem">,
): void {
  storage.removeItem(TMS_AUTH_LOGOUT_INTENT_KEY);
}

export function safeTmsReturnPath(candidate: unknown): string {
  if (candidate === "/signup/" || candidate === "/cloud-login/") return candidate;
  if (typeof candidate !== "string" || candidate.startsWith("//") || candidate.includes("\\")) {
    return TMS_AUTH_ROUTE_PATH;
  }
  try {
    const parsed = new URL(candidate, "https://tms.saturnusgo.com");
    if (
      parsed.origin === "https://tms.saturnusgo.com"
      && isWorkspacePath(parsed.pathname)
      && candidate.startsWith("/")
    ) return `${TMS_AUTH_ROUTE_PATH}${parsed.search}${parsed.hash}`;
  } catch { /* Invalid return paths use the default workspace route. */ }
  return TMS_AUTH_ROUTE_PATH;
}
