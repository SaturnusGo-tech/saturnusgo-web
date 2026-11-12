import bundledRelease from "../release.json";
import { isNewerRelease, parseVersion } from "../version/semver";
import { parseDesktopRelease } from "./release";
export const latestDesktopReleasePath = "/falcon/desktop/beta/latest.json";
export function createLatestReleaseReader(request: typeof fetch, minimumVersion = bundledRelease.version) {
  let newest = minimumVersion;
  return async () => {
    const response = await request(`${latestDesktopReleasePath}?check=${Date.now()}`, {
      cache: "no-store", credentials: "omit", redirect: "error", headers: { accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) throw new Error("Desktop release unavailable");
    const release = parseDesktopRelease(await response.json());
    if (!parseVersion(newest) || isNewerRelease(newest, release.version)) throw new Error("Stale desktop release");
    newest = release.version;
    return release;
  };
}
export const readLatestDesktopRelease = createLatestReleaseReader((...args) => fetch(...args));
