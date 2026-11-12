const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const NUMERIC = /^\d+$/;
export function parseVersion(value: string): RegExpExecArray | null {
  const parsed = SEMVER.exec(value);
  return parsed && !parsed[4]?.split(".").some(part => /^0\d+$/.test(part)) ? parsed : null;
}
const text = (left: string, right: string) => left === right ? 0 : left < right ? -1 : 1;
const number = (left: string, right: string) => left.length - right.length || text(left, right);
export function isNewerRelease(releaseVersion: string, installedVersion: string): boolean {
  const release = parseVersion(releaseVersion), installed = parseVersion(installedVersion);
  if (!release || !installed) return false;
  const nextParts = release[4]?.split(".") ?? [], currentParts = installed[4]?.split(".") ?? [];
  for (const part of [1, 2, 3]) {
    const order = number(release[part], installed[part]);
    if (order) return order > 0;
  }
  if (!nextParts.length || !currentParts.length) return currentParts.length > 0;
  for (const [index, next] of nextParts.entries()) {
    const current = currentParts[index];
    if (current === undefined) return true;
    if (next === current) continue;
    if (NUMERIC.test(next)) return NUMERIC.test(current) && number(next, current) > 0;
    return NUMERIC.test(current) || text(next, current) > 0;
  }
  return false;
}
