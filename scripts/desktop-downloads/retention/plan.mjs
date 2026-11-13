import { createHash } from "node:crypto";
import { compareVersions, validateRelease, filesFor, prefix, bucket } from "../release/manifest.mjs";
export const digest = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");
export const identity = object => ({ key: object.key, etag: object.etag, size: object.size, last_modified: object.last_modified });
export const fingerprint = snapshot => digest({ ...snapshot, objects: snapshot.objects.map(identity).sort((a, b) => a.key.localeCompare(b.key)) });
const date = value => { const time = Date.parse(value); if (!Number.isFinite(time)) throw Error("Invalid retention timestamp"); return time; };
function objectsFor(snapshot, release) {
  validateRelease(release); if (release.bucket !== bucket) throw Error("Unexpected installer bucket");
  const objects = snapshot.objects.filter(o => o.key.startsWith(release.prefix)).sort((a, b) => a.key.localeCompare(b.key));
  const expected = filesFor(release).sort();
  if (objects.length !== 4 || objects.some((o, i) => o.key !== expected[i])) return null;
  if (release.artifacts.some(file => objects.find(o => o.key === release.prefix + file.file)?.size !== file.bytes)) return null;
  return objects.map(identity);
}
function complete(snapshot, record) {
  if (record?.schema !== 1 || !["sha256", "inventory-only", "latest-manifest"].includes(record.verification)) return false;
  const objects = objectsFor(snapshot, record.release);
  return objects && digest(objects) === digest([...record.objects].map(identity).sort((a, b) => a.key.localeCompare(b.key)));
}
export function buildPlan({ snapshot, now = new Date().toISOString(), adoptions = [] }) {
  date(now); validateRelease(snapshot.latest);
  if (!objectsFor(snapshot, snapshot.latest)) throw Error("Latest complete installer set changed or missing");
  const records = { ...snapshot.records }, adopt = [], skipped = [];
  for (const record of adoptions) {
    if (records[record.release.version] || !complete(snapshot, record)) throw Error("Invalid legacy adoption plan");
    records[record.release.version] = record; adopt.push(record);
  }
  const versions = Object.keys(records).sort((a, b) => compareVersions(b, a));
  for (const version of versions) if (records[version].release.version !== version) throw Error("Invalid retention record version");
  const rollback = versions.find(v => compareVersions(v, snapshot.latest.version) < 0 && records[v].verification !== "inventory-only" && complete(snapshot, records[v]));
  const protectedVersions = [snapshot.latest.version, ...(rollback ? [rollback] : [])];
  const retire = [], remove = [];
  for (const version of versions) {
    if (protectedVersions.includes(version)) continue;
    const record = records[version];
    const retired = snapshot.retired[version];
    const remaining = snapshot.objects.filter(o => o.key.startsWith(record.release.prefix));
    const validRecord = objectsFor({ objects: record.objects }, record.release);
    const unchanged = validRecord && remaining.every(o => record.objects.some(original => digest(identity(original)) === digest(identity(o))));
    if (!unchanged || (!retired && !complete(snapshot, record))) { skipped.push({ version, reason: "unknown files or changed object identities" }); continue; }
    if (!rollback) { skipped.push({ version, reason: "verified rollback required" }); continue; }
    if (!retired) retire.push({ version, bytes: record.objects.reduce((n, o) => n + o.size, 0) });
    else {
      if (retired.schema !== 1 || retired.version !== version) throw Error("Invalid retirement marker");
      if (date(now) - date(retired.retiredAt) >= 7 * 86400000) remove.push(...remaining.map(o => ({ ...identity(o), reason: "retired-seven-days" })));
    }
  }
  for (const [version, upload] of Object.entries(snapshot.uploads)) {
    if (records[version] || protectedVersions.includes(version) || !rollback) continue;
    validateRelease(upload.release);
    if (upload.schema !== 1 || upload.release.version !== version) throw Error("Invalid upload provenance");
    const objects = snapshot.objects.filter(o => o.key.startsWith(upload.release.prefix));
    if (objects.some(o => !filesFor(upload.release).includes(o.key))) { skipped.push({ version, reason: "unknown upload files" }); continue; }
    const newest = Math.max(date(upload.startedAt), ...objects.map(o => date(o.last_modified)));
    if (date(now) - newest >= 48 * 3600000) remove.push(...objects.map(o => ({ ...identity(o), reason: "incomplete-forty-eight-hours" })));
  }
  const known = new Set([...versions, ...Object.keys(snapshot.uploads), snapshot.latest.version]);
  for (const o of snapshot.objects) {
    const version = o.key.slice(prefix.length).split("/")[0];
    if (!known.has(version) && version !== "latest.json" && version !== "_retention") skipped.push({ version, reason: "unmanaged legacy objects; explicit adoption required" });
  }
  return { schema: 1, bucket, generatedAt: now, snapshot: fingerprint(snapshot), latest: snapshot.latest.version, protected: protectedVersions,
    adopt, retire, delete: remove.sort((a, b) => a.key.localeCompare(b.key)), deleteBytes: remove.reduce((n, o) => n + o.size, 0),
    skipped: [...new Map(skipped.map(o => [o.version, o])).values()] };
}
