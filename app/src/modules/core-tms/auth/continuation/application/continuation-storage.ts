import { continuationFromLocation, safeContinuationPath } from "../domain/continuation-path";
export const CONTINUATION_KEY = "falcon.auth.continuation.v1";
const ttl = 5 * 60_000;
type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export function rememberContinuation(storage: Store, location: Pick<Location, "origin" | "pathname" | "search" | "hash">, now = Date.now()): void {
  try {
    const path = continuationFromLocation(location);
    if (path) storage.setItem(CONTINUATION_KEY, JSON.stringify({ version: 1, origin: location.origin, path, createdAt: now }));
  } catch { /* Per-tab continuation is optional when browser storage is unavailable. */ }
}
export function takeContinuation(storage: Store, origin: string, workspaceId?: string | null, now = Date.now()): string | null {
  try {
    const raw = storage.getItem(CONTINUATION_KEY); storage.removeItem(CONTINUATION_KEY);
    if (!raw || raw.length > 8192) return null;
    const value = JSON.parse(raw);
    if (value?.version !== 1 || value.origin !== origin || !Number.isFinite(value.createdAt)
      || value.createdAt > now || now - value.createdAt > ttl) return null;
    const path = safeContinuationPath(value.path, origin);
    if (!path) return null;
    const storedWorkspace = new URL(path, origin).searchParams.get("workspaceId");
    return storedWorkspace && workspaceId && storedWorkspace !== workspaceId ? null : path;
  } catch { return null; }
}
