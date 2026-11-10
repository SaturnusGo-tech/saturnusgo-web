export type CaptureRecord = {
  file: string; locale: "en" | "ru"; source: string; surface: "falcon" | "codex" | "linear"; origin: string;
  sourceUrl: string; workspace?: string; releaseSha?: string;
  uiLocale?: "en" | "ru"; contentLanguage?: "en" | "ru" | "mixed"; languageException?: string;
  capturedAt: string; viewport: { width: number; height: number; deviceScaleFactor: number }; rawSha256: string; sha256: string;
};
type CaptureInput = {
  publicDirectory: string; images: readonly { src: string; key?: string; width: number; height: number; locale: "en" | "ru" }[];
  records: readonly CaptureRecord[]; media: readonly { src: string; locale: "en" | "ru" }[];
  legacyDigests?: readonly string[]; complete?: boolean; requireLanguage?: boolean;
};

type CaptureLanguage = Pick<CaptureRecord, "file" | "surface" | "locale" | "uiLocale" | "contentLanguage" | "languageException">;

export function verifyCaptureLanguage(record: CaptureLanguage, requireLanguage = false) {
  const { file, surface, locale, uiLocale, contentLanguage, languageException } = record;
  const englishLinearUI = surface === "linear" && locale === "ru" && uiLocale === "en"
    && (contentLanguage === "en" || contentLanguage === "mixed");
  if ((requireLanguage || surface === "linear" || uiLocale !== undefined || contentLanguage !== undefined || languageException !== undefined)
    && !englishLinearUI && (uiLocale !== locale || (contentLanguage !== locale && contentLanguage !== "mixed"))) {
    throw new Error(`Capture UI and content language must match its locale: ${file}`);
  }
  if (englishLinearUI || contentLanguage === "mixed") {
    if (requireLanguage) throw new Error(`Capture with a language exception cannot pass full language verification: ${file}`);
    if (typeof languageException !== "string" || !languageException.trim() || languageException.trim().startsWith("--")) {
      throw new Error(`Capture language requires an explicit exception reason: ${file}`);
    }
  }
}

export function verifyProductionCaptures(input: CaptureInput) {
  const root = realpathSync(input.publicDirectory), seen = new Set<string>(), totals = { en: 0, ru: 0 };
  for (const image of input.images) {
    if (seen.has(image.src)) throw new Error(`Duplicate production screenshot: ${image.src}`);
    seen.add(image.src);
    const edition = image.locale === "ru" ? "2026-11-ru" : "2026-11";
    if (documentationMediaLocale(image.src) !== image.locale || !image.src.startsWith(`/falcon/docs/${edition}/`)) {
      throw new Error(`Invalid production screenshot locale: ${image.src}`);
    }
    if (image.width !== 3456 || image.height !== 2234) throw new Error(`Capture must be 3456×2234: ${image.src}`);
    const actual = realpathSync(join(root, image.src.slice(1))), inside = relative(root, actual);
    if (inside === ".." || inside.startsWith(`..${sep}`)) throw new Error(`Capture must remain inside public: ${image.src}`);
    const data = readFileSync(actual);
    if (data[0] !== 255 || data[1] !== 216) throw new Error(`Capture must be JPEG: ${image.src}`);
    let offset = 2, width = 0, height = 0;
    while (offset + 9 < data.length) {
      if (data[offset] !== 255) break;
      if ([0xc0, 0xc1, 0xc2].includes(data[offset + 1])) {
        width = data.readUInt16BE(offset + 7); height = data.readUInt16BE(offset + 5); break;
      }
      const length = data.readUInt16BE(offset + 2); if (length < 2) break; offset += length + 2;
    }
    if (width !== image.width || height !== image.height) throw new Error(`Capture JPEG dimensions do not match: ${image.src}`);
    if (data.length >= 1_400_000) throw new Error(`Production screenshot exceeds DPR2 budget: ${image.src}`);
    totals[image.locale] += data.length;
    const records = input.records.filter(record => record.file === image.src), record = records[0];
    if (records.length !== 1 || record.locale !== image.locale || !Number.isFinite(Date.parse(record.capturedAt))) {
      throw new Error(`Missing production capture provenance: ${image.src}`);
    }
    const isLinear = record.surface === "linear";
    if (isLinear) {
      if (record.source !== "authenticated-linear" || record.workspace !== undefined || record.releaseSha !== undefined
        || !/^linear-[a-z0-9][a-z0-9-]*$/.test(image.key ?? "") || !image.src.startsWith(`/falcon/docs/${edition}/linear-`)) {
        throw new Error(`Invalid Linear capture provenance or registry key: ${image.src}`);
      }
    } else if (record.source !== "authenticated-production-umbrella" || record.workspace !== "Umbrella Home") {
      throw new Error(`Missing authenticated production Umbrella provenance: ${image.src}`);
    }
    verifyCaptureLanguage(record, input.requireLanguage);
    const origin = new URL(record.origin);
    const falconOrigin = origin.protocol === "https:" && origin.hostname.endsWith(".saturnusgo.com")
      && !/lab|preview|localhost|example|mail-check/i.test(origin.hostname) && origin.pathname === "/" && !origin.search && !origin.hash
      && !origin.username && !origin.password && !origin.port;
    const validOrigin = isLinear ? record.origin === "https://linear.app" || record.origin === "https://app.linear.app"
      : record.surface === "codex" ? record.origin === "codex://desktop" || record.origin === "https://chatgpt.com"
      : record.surface === "falcon" && falconOrigin;
    if (!validOrigin) {
      throw new Error(`Invalid production capture origin for: ${image.src}`);
    }
    const state = new URL(record.sourceUrl);
    if ((!isLinear && !/^[a-f0-9]{40}$/.test(record.releaseSha ?? "")) || state.username || state.password
      || (record.surface !== "codex" && state.origin !== origin.origin) || (isLinear && state.hash)
      || (record.surface === "codex" && !(state.protocol === "codex:" || state.origin === "https://chatgpt.com"))
      || [...state.searchParams.keys()].some(key => /token|password|code|state|secret|invite|signature|session|auth|challenge|redirect|nonce|api.?key|client_id/i.test(key))) {
      throw new Error(`Missing release SHA or unsafe source state URL for: ${image.src}`);
    }
    const { viewport } = record;
    if (viewport.width !== 1728 || viewport.height !== 1117 || viewport.deviceScaleFactor !== 2) {
      throw new Error(`Production capture viewport must be 1728×1117 DPR2: ${image.src}`);
    }
    if (!/^[a-f0-9]{64}$/.test(record.rawSha256) || createHash("sha256").update(data).digest("hex") !== record.sha256) {
      throw new Error(`Production screenshot digest mismatch: ${image.src}`);
    }
    if (input.legacyDigests?.some(digest => digest === record.sha256 || digest === record.rawSha256)) {
      throw new Error(`Production screenshot duplicates legacy bytes: ${image.src}`);
    }
  }
  if (Object.values(totals).some(total => total >= 32_000_000)) throw new Error("Production guide exceeds DPR2 locale budget");
  if (input.complete) for (const media of input.media) {
    if (!input.images.some(image => image.src === media.src && image.locale === media.locale)) {
      throw new Error(`Guide screenshot not refreshed from production: ${media.src}`);
    }
  }
}
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, realpathSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { documentationMediaLocale } from "../../app/src/modules/core-tms/documentation/model/visual/guide-media";
import { isProductDocsPreviewImage } from "../../app/src/modules/core-tms/documentation/content/product-docs/guide-captures";
import { verifySuppliedCodexCaptures } from "./supplied/verify";


if (process.argv[1]?.endsWith("documentation-captures/verify.ts")) {
  const module = "app/src/modules/core-tms/documentation", publicDirectory = resolve("public");
  const images: CaptureInput["images"][number][] = [], records: CaptureRecord[] = [];
  const media: (CaptureInput["media"][number] & { width: number; height: number })[] = [];
  const legacyDigests: string[] = [];
  for (const locale of ["en", "ru"] as const) {
    const edition = locale === "ru" ? "2026-11-ru" : "2026-11", content = locale === "ru" ? "content-ru" : "content";
    const registry = JSON.parse(readFileSync(`${module}/${content}/walkthroughs/media/screenshots.production.json`, "utf8"));
    images.push(...Object.entries(registry).map(([key, image]) => ({ ...image as { src: string; width: number; height: number }, key, locale })));
    records.push(...JSON.parse(readFileSync(`public/falcon/docs/${edition}/production-provenance.json`, "utf8")).captures);
    const catalog = require(resolve(module, content, "catalog.ts"));
    for (const article of catalog.docArticles) for (const section of article.sections) for (const block of section.blocks) {
      if (block.kind === "walkthrough") media.push(...block.steps.map((step: { image: { src: string; width: number; height: number } }) => ({ ...step.image, locale })));
    }
    const legacy = `public/falcon/docs/2026-09${locale === "ru" ? "-ru" : ""}`;
    for (const file of readdirSync(legacy).filter(file => file.endsWith(".jpg"))) legacyDigests.push(createHash("sha256").update(readFileSync(join(legacy, file))).digest("hex"));
  }
  const previewMedia = media.filter(({ src, locale }) => isProductDocsPreviewImage(src, locale));
  const demo = JSON.parse(readFileSync("public/falcon/docs/2026-11-preview/provenance.json", "utf8")).captures as {
    file: string; source: string; locale: "en" | "ru"; sha256: string;
    viewport: { width: number; height: number; deviceScaleFactor: number };
  }[];
  if (demo.length !== previewMedia.length || new Set(demo.map(record => record.file)).size !== demo.length) {
    throw new Error("Product Docs preview screenshot inventory does not match the guides");
  }
  for (const image of previewMedia) {
    const record = demo.find(record => record.file === image.src && record.locale === image.locale);
    const bytes = readFileSync(join(publicDirectory, image.src.slice(1)));
    if (!record || record.source !== "isolated-product-docs-preview" || record.viewport.width !== 1728
      || record.viewport.height !== 1117 || record.viewport.deviceScaleFactor !== 2
      || image.width !== 3456 || image.height !== 2234 || bytes.length >= 1_400_000
      || createHash("sha256").update(bytes).digest("hex") !== record.sha256) {
      throw new Error(`Invalid Product Docs preview screenshot: ${image.src}`);
    }
  }
  const codexLegacy = JSON.parse(readFileSync("public/falcon/docs/2026-11/codex-provenance.json", "utf8"));
  const supplied = verifySuppliedCodexCaptures(publicDirectory,
    codexLegacy.files.filter((file: { source?: string }) => file.source === "user-supplied-codex-desktop"), media);
  legacyDigests.push(...codexLegacy.files.filter((file: { source?: string }) => file.source !== "user-supplied-codex-desktop")
    .flatMap((file: { sha256: string; sourcePngSha256: string }) => [file.sha256, file.sourcePngSha256]));
  verifyProductionCaptures({ publicDirectory, images, records, media: media.filter(image => !supplied.has(image.src) && !isProductDocsPreviewImage(image.src, image.locale)),
    legacyDigests, complete: process.argv.includes("--complete"), requireLanguage: process.argv.includes("--require-language") });
  const linearCaptures = images.filter(image => records.some(record => record.file === image.src && record.surface === "linear")).length;
  console.log(JSON.stringify({ productionCaptures: images.length - linearCaptures, linearCaptures, suppliedCodexCaptures: supplied.size,
    syntheticProductDocsCaptures: previewMedia.length, activeReferences: media.length, complete: process.argv.includes("--complete"), requireLanguage: process.argv.includes("--require-language"), verified: true }));
}
