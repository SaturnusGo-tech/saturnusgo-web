import publishedRelease from "./release.json";

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

const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const NUMERIC = /^\d+$/;

export function installedDesktopVersion(userAgent: string): string | undefined {
  const version = /(?:^|\s)FalconDesktop\/(\S+)/.exec(userAgent)?.[1];
  return version && SEMVER.test(version) ? version : undefined;
}

function compareText(left: string, right: string): number {
  return left === right ? 0 : left < right ? -1 : 1;
}

function compareNumbers(left: string, right: string): number {
  return left.length - right.length || compareText(left, right);
}

function isNewerRelease(releaseVersion: string, installedVersion: string): boolean {
  const release = SEMVER.exec(releaseVersion);
  const installed = SEMVER.exec(installedVersion);
  if (!release || !installed) return false;
  const releasePrerelease = release[4]?.split(".") ?? [];
  const installedPrerelease = installed[4]?.split(".") ?? [];
  if ([...releasePrerelease, ...installedPrerelease].some(part => /^0\d+$/.test(part))) return false;

  for (const part of [1, 2, 3]) {
    const order = compareNumbers(release[part], installed[part]);
    if (order) return order > 0;
  }
  if (!releasePrerelease.length || !installedPrerelease.length) return installedPrerelease.length > 0;

  for (const [index, next] of releasePrerelease.entries()) {
    const current = installedPrerelease[index];
    if (current === undefined) return true;
    if (next === current) continue;
    if (NUMERIC.test(next)) return NUMERIC.test(current) && compareNumbers(next, current) > 0;
    return NUMERIC.test(current) || compareText(next, current) > 0;
  }
  return false;
}

function publishedInstaller(release: Release, id: "mac-arm64" | "mac-x64" | "win-x64"): Installer | null {
  const extension = id === "win-x64" ? "beta-setup.exe" : "beta.dmg";
  const file = `Falcon-${release.version}-${id}-${extension}`;
  return release.artifacts.some(build => build.id === id && build.file === file)
    ? { file, href: `${release.baseUrl}${file}` } : null;
}

export async function getDesktopUpdate(identity: DesktopBrowserIdentity, release: Release = publishedRelease): Promise<DesktopUpdate | null> {
  const installed = installedDesktopVersion(identity.userAgent);
  if (!installed || !isNewerRelease(release.version, installed) ||
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
