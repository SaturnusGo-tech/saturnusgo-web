export const DESKTOP_ATTEMPT_KEY = "falcon.auth.desktop-attempt.v1";
const token = /^[A-Za-z0-9_-]{43}$/;
const work = "/testcases/umbrella-home/work/";
type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type Location = { readonly origin: string; readonly pathname: string; readonly search: string };
type Record = { readonly version: 1; readonly origin: string; readonly attempt: string; readonly createdAt: number };
export type DesktopAttemptState = { readonly status: "none" | "blocked" }
  | { readonly status: "active"; readonly record: Record };
export type DesktopAttemptTarget = { readonly status: "none" | "blocked" }
  | { readonly status: "redirect"; readonly path: string };
export function isDesktopEntry(path: string, managedWorkspace = false): boolean {
  return /^\/(?:login|cloud-login|signup)\/?$/.test(path) || (managedWorkspace && path === work);
}
function inspect(storage: Store, origin: string, now: number): DesktopAttemptState & { readonly previousAttempt?: string } {
  const raw = storage.getItem(DESKTOP_ATTEMPT_KEY);
  if (!raw) return { status: "none" };
  let previousAttempt: string | undefined;
  try {
    const value = raw.length <= 1024 ? JSON.parse(raw) : null;
    previousAttempt = typeof value?.attempt === "string" ? value.attempt : undefined;
    if (value?.version === 1 && value.origin === origin && token.test(value.attempt)
      && Number.isFinite(value.createdAt) && value.createdAt <= now && now - value.createdAt < 300_000) {
      return { status: "active", record: value };
    }
  } catch { /* Invalid browser state cannot authorize a desktop return. */ }
  storage.removeItem(DESKTOP_ATTEMPT_KEY);
  return { status: "blocked", previousAttempt };
}
export function captureDesktopAttempt(storage: Store, location: Location, now = Date.now(), managedWorkspace = false): DesktopAttemptState {
  if (!isDesktopEntry(location.pathname, managedWorkspace)) return { status: "none" };
  const values = new URLSearchParams(location.search).getAll("desktopAttempt");
  if (!values.length) return inspect(storage, location.origin, now);
  if (values.length !== 1 || !token.test(values[0]) || new URL(location.origin).origin !== location.origin
    || !location.origin.startsWith("https://")) {
    storage.removeItem(DESKTOP_ATTEMPT_KEY); return { status: "blocked" };
  }
  const previous = inspect(storage, location.origin, now);
  if (previous.status === "blocked" && previous.previousAttempt === values[0]) return { status: "blocked" };
  if (previous.status === "active" && previous.record.attempt === values[0]) return previous;
  const record: Record = { version: 1, origin: location.origin, attempt: values[0], createdAt: now };
  storage.setItem(DESKTOP_ATTEMPT_KEY, JSON.stringify(record));
  return { status: "active", record };
}
export function takeDesktopAttempt(storage: Store, origin: string, now = Date.now()): DesktopAttemptTarget {
  const state = inspect(storage, origin, now);
  storage.removeItem(DESKTOP_ATTEMPT_KEY);
  return state.status === "active" ? { status: "redirect", path: `/api/v1/auth/desktop/authorize?attempt=${state.record.attempt}` } : { status: state.status };
}
