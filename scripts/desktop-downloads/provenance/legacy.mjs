import { createHash } from "node:crypto";
import { compareVersions, validateRelease, filesFor, prefix } from "../release/manifest.mjs";
import { digest, identity } from "../retention/plan.mjs";

export async function adoptLegacy({ store, snapshot, now = new Date().toISOString(), log = console.error }) {
  validateRelease(snapshot.latest);
  const versions = [...new Set(snapshot.objects.map(o => o.key.slice(prefix.length).split("/")[0]))]
    .filter(v => { try { compareVersions(v, v); return !snapshot.records[v] && !snapshot.uploads[v]; } catch { return false; } })
    .sort((a, b) => compareVersions(b, a));
  const adoptions = [];
  const rollback = versions.find(v => compareVersions(v, snapshot.latest.version) < 0);
  for (const version of versions) {
    const release = structuredClone(snapshot.latest);
    release.version = version; release.prefix = `${prefix}${version}/`; release.baseUrl = `https://saturnusgo.com/${release.prefix}`;
    for (const file of release.artifacts) file.file = file.file.replace(`Falcon-${snapshot.latest.version}-`, `Falcon-${version}-`);
    const objects = snapshot.objects.filter(o => o.key.startsWith(release.prefix));
    if (objects.length !== 4 || filesFor(release).some(key => !objects.some(o => o.key === key))) continue;
    const response = await store.read(release.prefix + release.checksums);
    if (!response.ok) throw Error("Legacy checksum read failed");
    const checksum = await response.text(); if (Buffer.byteLength(checksum) > 1024) throw Error("Oversized legacy checksums");
    const entries = checksum.trimEnd().split("\n").map(line => /^([a-f0-9]{64})  ([^/\\]+)$/.exec(line));
    if (entries.length !== 3 || entries.some(entry => !entry) || new Set(entries.map(entry => entry[2])).size !== 3) continue;
    for (const file of release.artifacts) {
      const entry = entries.find(item => item[2] === file.file); if (!entry) throw Error("Unexpected legacy checksum references");
      file.sha256 = entry[1]; file.bytes = objects.find(o => o.key === release.prefix + file.file).size;
    }
    validateRelease(release);
    let verification = version === snapshot.latest.version ? "latest-manifest" : "inventory-only";
    if (version === snapshot.latest.version && digest(release) !== digest(snapshot.latest)) throw Error("Current manifest and checksum identities disagree");
    if (version === rollback) {
      for (const file of release.artifacts) {
        log(`Verifying rollback SHA-256: ${file.file}`);
        const remote = await store.read(release.prefix + file.file); if (!remote.ok || !remote.body) throw Error("Rollback download failed");
        const hash = createHash("sha256"); let bytes = 0;
        for await (const chunk of remote.body) { bytes += chunk.length; hash.update(chunk); }
        if (bytes !== file.bytes || hash.digest("hex") !== file.sha256) throw Error("Rollback SHA-256 mismatch");
      }
      verification = "sha256";
    }
    adoptions.push({ schema: 1, release, verification, recordedAt: now, objects: objects.map(identity).sort((a, b) => a.key.localeCompare(b.key)) });
  }
  return adoptions;
}
