import { createHash } from "node:crypto";
import { closeSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, openSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { verifyProductionCaptures, type CaptureRecord } from "./verify";
import { documentationSectionMedia } from "../../app/src/modules/core-tms/documentation/model/visual/guide-media";
import { historicalGuideMedia } from "../../app/src/modules/core-tms/documentation/model/visual/compatibility/historical-media";
import type { DocArticle } from "../../app/src/modules/core-tms/documentation/model/article";

const args = process.argv.slice(2), get = (name: string) => {
  const index = args.indexOf(name); return index < 0 ? undefined : args[index + 1];
};
const locale = get("--locale"), key = get("--key"), raw = get("--raw"), origin = get("--origin");
const capturedAt = get("--captured-at"), surface = get("--surface") ?? "falcon";
const sourceUrl = get("--source-url"), releaseSha = get("--release-sha");
const uiLocale = get("--ui-locale"), contentLanguage = get("--content-language"), replaceExisting = args.includes("--replace-existing");
const languageException = get("--language-exception")?.trim();
if (!locale || !["en", "ru"].includes(locale) || !key || !raw || !origin || !capturedAt || !["falcon", "codex"].includes(surface)
  || !sourceUrl || !releaseSha || !/^[a-z0-9][a-z0-9-]{0,109}$/.test(key)) {
  throw new Error("Usage: npx tsx scripts/documentation-captures/import.ts --locale en|ru --ui-locale en|ru --content-language en|ru|mixed --key <stable-key> --raw <actual-capture> --origin <production-origin> --source-url <actual-state-url> --release-sha <full-commit-sha> --captured-at <ISO-time> [--language-exception <explicit-reason-for-mixed-content>] [--surface falcon|codex] [--name <date-versioned-basename>] [--replace-existing]");
}
if (uiLocale !== locale || (contentLanguage !== locale && contentLanguage !== "mixed")) {
  throw new Error("Capture language mismatch: --ui-locale must match --locale; --content-language must match or explicitly declare mixed content");
}
if (contentLanguage === "mixed" && (!languageException || languageException.startsWith("--"))) {
  throw new Error("Mixed content language requires a nonempty explicit --language-exception reason");
}
if (!Number.isFinite(Date.parse(capturedAt))) throw new Error("Invalid capture timestamp");
const captureDate = new Date(capturedAt).toISOString().slice(0, 10).replaceAll("-", "");
const stateUrl = new URL(sourceUrl), redactedQueryKeys: string[] = [];
for (const key of [...stateUrl.searchParams.keys()]) if (/token|password|code|state|secret|invite|signature|session|auth|challenge|redirect|nonce|api.?key|client_id/i.test(key)) {
  stateUrl.searchParams.delete(key); redactedQueryKeys.push(key);
}
const edition = locale === "ru" ? "2026-11-ru" : "2026-11", content = locale === "ru" ? "content-ru" : "content";
const name = get("--name") ?? `${key}-${locale}-production${captureDate}`;
if (!/^[a-z0-9][a-z0-9-]{0,139}$/.test(name)) throw new Error("Invalid production capture filename");
if (!new RegExp(`(?:-|production)${captureDate}$`).test(name)) throw new Error("Capture filename must be versioned with its capture date (YYYYMMDD)");
const src = `/falcon/docs/${edition}/${name}.jpg`, destination = resolve("public", src.slice(1));
const registryPath = `app/src/modules/core-tms/documentation/${content}/walkthroughs/media/screenshots.production.json`;
const provenancePath = `public/falcon/docs/${edition}/production-provenance.json`;
const aliasesPath = `app/src/modules/core-tms/documentation/model/visual/compatibility/production-aliases-${locale}.json`;
const registry = JSON.parse(readFileSync(registryPath, "utf8"));
const previousImage = registry[key];
if (previousImage && !replaceExisting) throw new Error("Capture key already exists; use --replace-existing after reviewing a fresh capture");
if (!previousImage && replaceExisting) throw new Error("--replace-existing requires an existing capture key");
if (existsSync(destination)) throw new Error("Capture file already exists; choose a fresh date-versioned basename");
if (previousImage && get("--replaces") && get("--replaces") !== previousImage.src) {
  throw new Error("--replaces must match the existing capture key's exact source");
}
if (previousImage && !existsSync(resolve("public", previousImage.src.slice(1)))) throw new Error("Previous capture file is missing; preserve it before replacement");
const source = resolve(raw), bytes = readFileSync(source), dimensions = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", source], { encoding: "utf8" });
if (!/pixelWidth:\s+3456\b/.test(dimensions) || !/pixelHeight:\s+2234\b/.test(dimensions)) {
  throw new Error("Raw capture must already be 3456×2234. Re-capture at 1728×1117 DPR2; do not upscale or crop it.");
}
const temporary = mkdtempSync(join(tmpdir(), "falcon-production-capture-")), converted = join(temporary, src.slice(1));
try {
  mkdirSync(dirname(converted), { recursive: true });
  execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "70", source, "--out", converted], { stdio: "pipe" });
  const image = { src, width: 3456, height: 2234 };
  const record: CaptureRecord & { rawFilename: string; method: string; redactedQueryKeys: string[] } = {
    file: src, locale: locale as "en" | "ru", uiLocale: uiLocale as "en" | "ru", contentLanguage: contentLanguage as "en" | "ru" | "mixed",
    ...(languageException ? { languageException } : {}),
    source: "authenticated-production-umbrella", surface: surface as "falcon" | "codex",
    origin, workspace: "Umbrella Home", capturedAt, viewport: { width: 1728, height: 1117, deviceScaleFactor: 2 },
    sourceUrl: stateUrl.toString(), releaseSha, redactedQueryKeys,
    rawSha256: createHash("sha256").update(bytes).digest("hex"), sha256: createHash("sha256").update(readFileSync(converted)).digest("hex"),
    rawFilename: basename(source), method: "Actual authenticated production browser/app capture; JPEG transcoded without crop, resize or semantic edits.",
  };
  const previous = JSON.parse(readFileSync("public/falcon/docs/2026-11/codex-provenance.json", "utf8"));
  const legacyDigests: string[] = previous.files.flatMap((file: { sha256: string; sourcePngSha256: string }) => [file.sha256, file.sourcePngSha256]);
  for (const edition of ["2026-09", "2026-09-ru"]) {
    const folder = `public/falcon/docs/${edition}`;
    for (const file of readdirSync(folder).filter(file => file.endsWith(".jpg"))) {
      legacyDigests.push(createHash("sha256").update(readFileSync(join(folder, file))).digest("hex"));
    }
  }
  verifyProductionCaptures({ publicDirectory: temporary, images: [{ ...image, locale: record.locale }], records: [record], media: [], legacyDigests });
  const { docArticles } = require(resolve(`app/src/modules/core-tms/documentation/${content}/catalog.ts`)) as { docArticles: DocArticle[] };
  const oldSrc = previousImage?.src ?? get("--replaces") ?? `/falcon/docs/2026-09${locale === "ru" ? "-ru" : ""}/${key}.jpg`;
  const replacements = docArticles.flatMap(article => article.sections.flatMap(section => {
    const oldMedia = documentationSectionMedia(section);
    const updated = { ...section, blocks: section.blocks.map(block => block.kind !== "walkthrough" ? block : {
      ...block, steps: block.steps.map(step => step.image.src !== oldSrc ? step : { ...step, image: { ...step.image, ...image } }),
    }) };
    const newMedia = documentationSectionMedia(updated);
    return oldMedia.flatMap((old, index) => old.src !== oldSrc ? [] : [{ locale: record.locale, articleId: article.id, sectionId: section.id,
      id: old.id, src: old.src, currentId: newMedia[index].id, currentSrc: newMedia[index].src },
    ...historicalGuideMedia.filter(alias => alias.locale === locale && alias.currentId === old.id && alias.currentSrc === old.src
      && alias.contexts.some(context => context.articleId === article.id && context.sectionId === section.id))
      .map(alias => ({ locale: record.locale, articleId: article.id, sectionId: section.id,
        id: alias.id, src: alias.src, currentId: newMedia[index].id, currentSrc: newMedia[index].src }))]);
  }));
  const lockPath = `${registryPath}.lock`, lock = openSync(lockPath, "wx");
  try {
    const currentRegistry = JSON.parse(readFileSync(registryPath, "utf8"));
    const currentProvenance = JSON.parse(readFileSync(provenancePath, "utf8"));
    const currentAliases = JSON.parse(readFileSync(aliasesPath, "utf8"));
    if (JSON.stringify(currentRegistry[key]) !== JSON.stringify(previousImage) || existsSync(destination)) {
      throw new Error("Capture key/file changed during import; review the fresh registry before retrying");
    }
    type Alias = typeof replacements[number];
    const retargetedAliases = currentAliases.map((alias: Alias) => {
      const replacement = replacements.find(next => next.locale === alias.locale && next.articleId === alias.articleId
        && next.sectionId === alias.sectionId && next.id === alias.currentId && next.src === alias.currentSrc);
      return replacement ? { ...alias, currentId: replacement.currentId, currentSrc: replacement.currentSrc } : alias;
    });
    const aliases = new Map<string, Alias>();
    for (const alias of [...retargetedAliases, ...replacements]) {
      aliases.set(JSON.stringify([alias.locale, alias.articleId, alias.sectionId, alias.id, alias.src]), alias);
    }
    mkdirSync(dirname(destination), { recursive: true }); copyFileSync(converted, destination);
    currentRegistry[key] = image; currentProvenance.captures.push(record);
    for (const [file, data] of [[provenancePath, currentProvenance], [aliasesPath, [...aliases.values()]], [registryPath, currentRegistry]] as const) {
      writeFileSync(`${file}.tmp`, JSON.stringify(data, null, 2) + "\n"); renameSync(`${file}.tmp`, file);
    }
  } finally { closeSync(lock); rmSync(lockPath); }
  console.log(JSON.stringify({ key, ...image, sha256: record.sha256, registered: true, languageVerified: contentLanguage === locale }));
} finally { rmSync(temporary, { recursive: true, force: true }); }
