import { createHash } from "node:crypto";
import { readFileSync, realpathSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { documentationMediaLocale } from "../../../app/src/modules/core-tms/documentation/model/visual/guide-media";

type SuppliedCapture = {
  file: string; locale: "en" | "ru"; source: "user-supplied-codex-desktop"; surface: "codex";
  contentLanguage: "en"; receivedOn: string; width: number; height: number;
  sha256: string; sourcePng: string; sourcePngSha256: string;
};
type GuideImage = { src: string; locale: "en" | "ru"; width: number; height: number };

/** User evidence keeps its actual size and provenance; it is never relabelled as our production capture. */
export function verifySuppliedCodexCaptures(publicDirectory: string, records: readonly unknown[], media: readonly GuideImage[]) {
  const root = realpathSync(publicDirectory), verified = new Set<string>();
  for (const candidate of records) {
    if (!candidate || typeof candidate !== "object") throw new Error("Invalid supplied Codex provenance");
    const record = candidate as SuppliedCapture;
    if (record.source !== "user-supplied-codex-desktop" || record.surface !== "codex" || record.contentLanguage !== "en"
      || !["en", "ru"].includes(record.locale) || !/^\d{4}-\d{2}-\d{2}$/.test(record.receivedOn)
      || !Number.isFinite(Date.parse(record.receivedOn))
      || !/^codex-clipboard-[a-f0-9-]+\.png$/.test(record.sourcePng)
      || !/^[a-f0-9]{64}$/.test(record.sourcePngSha256)
      || ["releaseSha", "capturedAt", "viewport", "origin", "workspace", "sourceUrl"].some(key => key in candidate)) {
      throw new Error("Invalid supplied Codex provenance; do not invent production capture metadata");
    }
    if (!/^\/falcon\/docs\/2026-11(?:-ru)?\/codex-desktop-[a-z-]+-user\d{8}\.jpg$/.test(record.file)
      || documentationMediaLocale(record.file) !== record.locale || verified.has(record.file)) {
      throw new Error(`Invalid or duplicate supplied Codex path: ${record.file}`);
    }
    if (![record.width, record.height].every(size => Number.isInteger(size) && size >= 800 && size <= 10000)) {
      throw new Error(`Invalid supplied Codex dimensions: ${record.file}`);
    }
    const actual = realpathSync(join(root, record.file.slice(1))), inside = relative(root, actual);
    if (inside === ".." || inside.startsWith(`..${sep}`)) throw new Error("Supplied Codex capture must remain inside public");
    const data = readFileSync(actual);
    if (data[0] !== 255 || data[1] !== 216 || data.length >= 1_400_000) throw new Error("Invalid supplied Codex JPEG or size budget");
    let offset = 2, width = 0, height = 0;
    while (offset + 9 < data.length) {
      if (data[offset] !== 255) break;
      if ([0xc0, 0xc1, 0xc2].includes(data[offset + 1])) {
        width = data.readUInt16BE(offset + 7); height = data.readUInt16BE(offset + 5); break;
      }
      const length = data.readUInt16BE(offset + 2); if (length < 2) break; offset += length + 2;
    }
    if (width !== record.width || height !== record.height) throw new Error(`Supplied Codex JPEG dimensions do not match: ${record.file}`);
    if (!/^[a-f0-9]{64}$/.test(record.sha256) || createHash("sha256").update(data).digest("hex") !== record.sha256) {
      throw new Error(`Supplied Codex screenshot digest mismatch: ${record.file}`);
    }
    for (const image of media.filter(image => image.src === record.file)) {
      if (image.locale !== record.locale || image.width !== width || image.height !== height) {
        throw new Error(`Guide metadata does not match supplied Codex capture: ${record.file}`);
      }
    }
    verified.add(record.file);
  }
  for (const image of media.filter(image => /\/codex-desktop-.*-user\d{8}\.jpg$/.test(image.src))) {
    if (!verified.has(image.src)) throw new Error(`Missing supplied Codex provenance: ${image.src}`);
  }
  return verified;
}
