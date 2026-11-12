import { readLatestDesktopRelease } from "./latest/source";
import type { DesktopRelease } from "./latest/release";
import { isNewerRelease, parseVersion } from "./version/semver";

type DesktopBrowserIdentity = Pick<Navigator, "userAgent"> & {
  userAgentData?: {
    getHighEntropyValues(hints: string[]): Promise<{ architecture?: string; bitness?: string }>;
  };
};
type Release = {
  version: string;
  baseUrl: string;
  artifacts: readonly { id: string; file: string }[];
};
type Installer = { href: string; file: string };
export type DesktopUpdate = { version: string } & (
  { installer: Installer } | { installer: null; macFiles: readonly string[] }
);

export function installedDesktopVersion(userAgent: string): string | undefined {
  const version = /(?:^|\s)FalconDesktop\/(\S+)/.exec(userAgent)?.[1];
  return version && parseVersion(version) ? version : undefined;
}

function publishedInstaller(release: Release, id: "mac-arm64" | "mac-x64" | "win-x64"): Installer | null {
  const extension = id === "win-x64" ? "beta-setup.exe" : "beta.dmg";
  const file = `Falcon-${release.version}-${id}-${extension}`;
  return release.artifacts.some(build => build.id === id && build.file === file)
    ? { file, href: `${release.baseUrl}${file}` } : null;
}

export async function getDesktopUpdate(identity: DesktopBrowserIdentity, release?: Release): Promise<DesktopUpdate | null> {
  const installed = installedDesktopVersion(identity.userAgent);
  if (!installed) return null;
  release ??= await readLatestDesktopRelease();
  if (!isNewerRelease(release.version, installed) ||
      release.baseUrl !== `https://saturnusgo.com/falcon/desktop/beta/${release.version}/`) return null;
  const version = release.version;
  if (/\bWindows NT\b/.test(identity.userAgent)) {
    const installer = publishedInstaller(release, "win-x64");
    return installer ? { version, installer } : null;
  }
  if (!/\bMacintosh\b/.test(identity.userAgent)) return null;

  const arm = publishedInstaller(release, "mac-arm64");
  const intel = publishedInstaller(release, "mac-x64");
  if (!arm && !intel) return null;
  try {
    const hints = await identity.userAgentData?.getHighEntropyValues(["architecture", "bitness"]);
    if (hints?.bitness === "64" && hints.architecture === "arm") return arm ? { version, installer: arm } : null;
    if (hints?.bitness === "64" && hints.architecture === "x86") return intel ? { version, installer: intel } : null;
  } catch {
    // Some managed clients block high-entropy hints. Let the user choose their Mac installer.
  }
  const macFiles = [arm?.file, intel?.file].filter((file): file is string => file !== undefined);
  return { version, installer: null, macFiles };
}

export type AvailableDesktopUpdate = DesktopUpdate & { release: DesktopRelease };
export async function loadDesktopUpdate(identity: DesktopBrowserIdentity): Promise<AvailableDesktopUpdate | null> {
  if (!installedDesktopVersion(identity.userAgent)) return null;
  const release = await readLatestDesktopRelease();
  const update = await getDesktopUpdate(identity, release);
  return update ? { ...update, release } : null;
}
