function version(value) {
  const match = typeof value === "string" && /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([\da-zA-Z-]+(?:\.[\da-zA-Z-]+)*))?(?:\+[\da-zA-Z-]+(?:\.[\da-zA-Z-]+)*)?$/.exec(value);
  if (!match || match[4]?.split(".").some(part => /^0\d+$/.test(part))) throw new Error("Invalid desktop version");
  return match;
}
const text = (a, b) => a === b ? 0 : a < b ? -1 : 1;
const numeric = (a, b) => a.length - b.length || text(a, b);
export function compareVersions(a, b) {
  const left = version(a), right = version(b);
  for (const index of [1, 2, 3]) { const order = numeric(left[index], right[index]); if (order) return order; }
  const l = left[4]?.split(".") ?? [], r = right[4]?.split(".") ?? [];
  if (!l.length || !r.length) return l.length ? -1 : r.length ? 1 : 0;
  for (let index = 0; index < Math.max(l.length, r.length); index++) {
    if (l[index] === undefined) return -1; if (r[index] === undefined) return 1;
    if (l[index] === r[index]) continue;
    const ln = /^\d+$/.test(l[index]), rn = /^\d+$/.test(r[index]);
    return ln && rn ? numeric(l[index], r[index]) : ln !== rn ? ln ? -1 : 1 : text(l[index], r[index]);
  }
  return 0;
}
export function validateRelease(release) {
  version(release?.version);
  if (release.channel !== "beta" || release.baseUrl !== `https://saturnusgo.com/falcon/desktop/beta/${release.version}/` ||
    release.prefix !== `falcon/desktop/beta/${release.version}/` || typeof release.bucket !== "string" || !/^[a-z0-9-]+$/.test(release.bucket) ||
    release.checksums !== "SHA256SUMS.txt" || !Array.isArray(release.artifacts) || release.artifacts.length !== 3) throw new Error("Invalid desktop manifest");
  const formats = { "mac-arm64": ["mac", "beta.dmg", "application/x-apple-diskimage"], "mac-x64": ["mac", "beta.dmg", "application/x-apple-diskimage"],
    "win-x64": ["windows", "beta-setup.exe", "application/vnd.microsoft.portable-executable"] };
  const seen = new Set();
  for (const file of release.artifacts) {
    const format = file && Object.hasOwn(formats, file.id) && formats[file.id];
    if (!format || seen.has(file.id) || file.platform !== format[0] || file.file !== `Falcon-${release.version}-${file.id}-${format[1]}` ||
      file.contentType !== format[2] || !Number.isSafeInteger(file.bytes) || file.bytes <= 0 || typeof file.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(file.sha256) ||
      ![file.label, file.minimum].every(text => typeof text === "string" && text.trim().length > 0 && text.length < 120)) throw new Error("Invalid desktop artifact");
    seen.add(file.id);
  }
}

export const prefix = "falcon/desktop/beta/";
export const bucket = "cdn-saturnusgo";
export const latestKey = `${prefix}latest.json`;
export const metadataKey = (kind, version) => `${prefix}_retention/${kind}/${version}.json`;
export const filesFor = release => [...release.artifacts.map(file => release.prefix + file.file), release.prefix + release.checksums];
