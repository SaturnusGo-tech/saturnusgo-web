import { readFileSync } from "node:fs";
const template = JSON.parse(readFileSync(new URL("../../../../app/src/modules/core-tms/desktop-downloads/model/release.json", import.meta.url)));
export function metadata(version, verification = "sha256") {
  const release = JSON.parse(JSON.stringify(template).replaceAll(template.version, version));
  return { schema: 1, release, verification, recordedAt: "2026-11-01T10:00:00.000Z", objects: releaseObjects(version) };
}
export function releaseObjects(version) {
  const files = ["mac-arm64-beta.dmg", "mac-x64-beta.dmg", "win-x64-beta-setup.exe"].map(id => `Falcon-${version}-${id}`);
  return [...files, "SHA256SUMS.txt"].map((file, index) => ({ key: `falcon/desktop/beta/${version}/${file}`, etag: `${version}-${index}`,
    size: index === 3 ? 299 : template.artifacts[index].bytes, last_modified: "2026-11-01T10:00:00.000Z" }));
}
export function fixture() {
  return { latest: template, objects: ["0.2.10", "0.2.11", "0.2.12"].flatMap(releaseObjects).concat({ key: "falcon/desktop/beta/latest.json", size: 1200, etag: "latest", last_modified: "2026-11-01T10:00:00.000Z" }),
    records: Object.fromEntries(["0.2.10", "0.2.11", "0.2.12"].map(v => [v, metadata(v)])), retired: {}, uploads: {} };
}
export function fakeStore(snapshot) {
  return { snapshot: structuredClone(snapshot), deleted: [], written: [],
    async inventory() { return structuredClone(this.snapshot); },
    async putJson(key, value) { this.written.push({ key, value }); },
    async remove(key) { this.deleted.push(key); this.snapshot.objects = this.snapshot.objects.filter(o => o.key !== key); this.afterDelete?.(); },
  };
}
