import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { verifyProductionCaptures, type CaptureRecord } from "../verify";

const bytes = Buffer.from([255, 216, 255, 192, 0, 17, 8, 8, 186, 13, 128, 3, 1, 17, 0, 2, 17, 0, 3, 17, 0, 255, 217]);
const src = "/falcon/docs/2026-11/production-test.jpg";
const image = { src, width: 3456, height: 2234 };
const record: CaptureRecord = { file: src, locale: "en", source: "authenticated-production-umbrella", surface: "falcon",
  origin: "https://umbrella-falcon.saturnusgo.com", workspace: "Umbrella Home", capturedAt: "2026-11-03T11:00:00Z",
  sourceUrl: "https://umbrella-falcon.saturnusgo.com/testcases/umbrella-home/work/?view=cases&caseId=case_123", releaseSha: "a".repeat(40),
  viewport: { width: 1728, height: 1117, deviceScaleFactor: 2 }, rawSha256: "a".repeat(64),
  sha256: createHash("sha256").update(bytes).digest("hex") };

test("production capture registry verifies source, dimensions, integrity and complete guide coverage", () => {
  const directory = mkdtempSync(join(tmpdir(), "falcon-production-media-"));
  try {
    mkdirSync(join(directory, "falcon/docs/2026-11"), { recursive: true });
    writeFileSync(join(directory, src), bytes);
    const input = { publicDirectory: directory, images: [{ ...image, locale: "en" as const }], records: [record], media: [{ src, locale: "en" as const }] };
    assert.doesNotThrow(() => verifyProductionCaptures(input));
    assert.throws(() => verifyProductionCaptures({ ...input, records: [{ ...record, source: "synthetic" }] }), /production/i);
    assert.throws(() => verifyProductionCaptures({ ...input, records: [{ ...record, origin: "https://codex-lab-falcon.saturnusgo.com" }] }), /production/i);
    assert.throws(() => verifyProductionCaptures({ ...input, records: [{ ...record, sha256: "b".repeat(64) }] }), /digest/i);
    assert.throws(() => verifyProductionCaptures({ ...input, images: [{ ...image, width: 1728, locale: "en" }] }), /3456/);
    assert.throws(() => verifyProductionCaptures({ ...input, media: [{ src: "/falcon/docs/2026-09/legacy.jpg", locale: "en" }], complete: true }), /not refreshed/i);
    assert.throws(() => verifyProductionCaptures({ ...input, legacyDigests: [record.sha256] }), /legacy/i);
    assert.throws(() => verifyProductionCaptures({ ...input, legacyDigests: [record.rawSha256] }), /legacy/i);
    assert.throws(() => verifyProductionCaptures({ ...input, records: [{ ...record, origin: "https://secret@umbrella-falcon.saturnusgo.com" }] }), /origin/i);
    assert.throws(() => verifyProductionCaptures({ ...input, records: [{ ...record, sourceUrl: record.sourceUrl + "&token=private" }] }), /unsafe/i);
    assert.throws(() => verifyProductionCaptures({ ...input, records: [{ ...record, releaseSha: "unknown" }] }), /SHA/i);
    assert.throws(() => verifyProductionCaptures({ ...input, images: [{ ...image, locale: "ru" }] }), /locale/i);
    assert.throws(() => verifyProductionCaptures({ ...input, requireLanguage: true }), /language/i);
    assert.doesNotThrow(() => verifyProductionCaptures({ ...input, requireLanguage: true,
      records: [{ ...record, uiLocale: "en", contentLanguage: "en" }] }));
    assert.throws(() => verifyProductionCaptures({ ...input,
      records: [{ ...record, uiLocale: "en", contentLanguage: "ru" }] }), /language/i);
    assert.throws(() => verifyProductionCaptures({ ...input,
      records: [{ ...record, uiLocale: "ru", contentLanguage: "en" }] }), /language/i);
    assert.throws(() => verifyProductionCaptures({ ...input,
      records: [{ ...record, uiLocale: "en" }] }), /language/i);
    const mixed = { ...record, uiLocale: "en" as const, contentLanguage: "mixed" as const,
      languageException: "Immutable external English commit summaries." };
    assert.doesNotThrow(() => verifyProductionCaptures({ ...input, records: [mixed] }));
    assert.throws(() => verifyProductionCaptures({ ...input, requireLanguage: true, records: [mixed] }), /language/i);
    assert.throws(() => verifyProductionCaptures({ ...input, records: [{ ...mixed, languageException: undefined }] }), /language/i);
    assert.throws(() => verifyProductionCaptures({ ...input, records: [{ ...mixed, languageException: "  " }] }), /language/i);
    assert.throws(() => verifyProductionCaptures({ ...input, records: [{ ...mixed, uiLocale: "ru" }] }), /language/i);
    assert.throws(() => verifyProductionCaptures({ ...input, records: [{ ...mixed, contentLanguage: "ru" }] }), /language/i);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test("Linear capture provenance is limited to the exact host and registered Linear asset keys", () => {
  const directory = mkdtempSync(join(tmpdir(), "falcon-linear-media-"));
  try {
    const src = "/falcon/docs/2026-11-ru/linear-team-identifier-ru-20261105.jpg";
    mkdirSync(join(directory, "falcon/docs/2026-11-ru"), { recursive: true });
    writeFileSync(join(directory, src), bytes);
    const image = { src, key: "linear-team-identifier", width: 3456, height: 2234, locale: "ru" as const };
    const linear = { file: src, locale: "ru" as const, source: "authenticated-linear", surface: "linear" as const,
      origin: "https://app.linear.app", sourceUrl: "https://app.linear.app/example/settings/teams/QA/general",
      capturedAt: record.capturedAt, viewport: record.viewport, sha256: record.sha256, rawSha256: record.rawSha256,
      uiLocale: "en" as const, contentLanguage: "en" as const, languageException: "Linear is shown in English." };
    const input = { publicDirectory: directory, images: [image], records: [linear], media: [image], complete: true };
    assert.doesNotThrow(() => verifyProductionCaptures(input));
    assert.doesNotThrow(() => verifyProductionCaptures({ ...input, records: [{ ...linear,
      origin: "https://linear.app", sourceUrl: "https://linear.app/example/settings" }] }));
    assert.throws(() => verifyProductionCaptures({ ...input, images: [{ ...image, key: "jira-connection" }] }), /linear/i);
    for (const update of [
      { origin: "https://api.linear.app" },
      { origin: "https://linear.app", sourceUrl: linear.sourceUrl },
      { sourceUrl: "https://app.linear.app.example.com/example/settings" },
      { sourceUrl: "https://app.linear.app@example.com/example/settings" },
      { sourceUrl: "https://app.linear.app/example/settings#secret" },
      { sourceUrl: "https://app.linear.app/example/settings?token=private" },
      { releaseSha: record.releaseSha },
      { workspace: "Umbrella Home" },
    ]) assert.throws(() => verifyProductionCaptures({ ...input, records: [{ ...linear, ...update }] }), /linear|unsafe/i);
    assert.throws(() => verifyProductionCaptures({ ...input, records: [{ ...linear, languageException: undefined }] }), /exception/i);
    assert.throws(() => verifyProductionCaptures({ ...input, requireLanguage: true }), /language/i);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
