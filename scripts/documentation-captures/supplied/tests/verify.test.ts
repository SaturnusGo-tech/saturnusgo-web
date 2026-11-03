import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { verifySuppliedCodexCaptures } from "../verify";

const bytes = Buffer.from([255, 216, 255, 192, 0, 17, 8, 7, 8, 11, 64, 3, 1, 17, 0, 2, 17, 0, 3, 17, 0, 255, 217]);
const src = "/falcon/docs/2026-11/codex-desktop-transport-user20261103.jpg";
const record = {
  file: src, locale: "en", source: "user-supplied-codex-desktop", surface: "codex", contentLanguage: "en",
  receivedOn: "2026-11-03", width: 2880, height: 1800,
  sourcePng: "codex-clipboard-7221b7c4-14e1-4bba-ab98-ee5520f5e341.png", sourcePngSha256: "a".repeat(64),
  sha256: createHash("sha256").update(bytes).digest("hex"),
};
const image = { src, locale: "en" as const, width: 2880, height: 1800 };

test("supplied Codex captures preserve evidence and cannot impersonate production provenance", () => {
  const directory = mkdtempSync(join(tmpdir(), "falcon-supplied-media-"));
  try {
    mkdirSync(join(directory, "falcon/docs/2026-11"), { recursive: true });
    writeFileSync(join(directory, src), bytes);
    assert.deepEqual([...verifySuppliedCodexCaptures(directory, [record], [image])], [src]);
    assert.throws(() => verifySuppliedCodexCaptures(directory, [{ ...record, releaseSha: "b".repeat(40) }], [image]), /invent production/);
    assert.throws(() => verifySuppliedCodexCaptures(directory, [{ ...record, viewport: { width: 1728, height: 1117 } }], [image]), /invent production/);
    assert.throws(() => verifySuppliedCodexCaptures(directory, [{ ...record, source: "authenticated-production-umbrella" }], [image]), /provenance/);
    assert.throws(() => verifySuppliedCodexCaptures(directory, [{ ...record, contentLanguage: "ru" }], [image]), /provenance/);
    assert.throws(() => verifySuppliedCodexCaptures(directory, [{ ...record, sha256: "b".repeat(64) }], [image]), /digest/);
    assert.throws(() => verifySuppliedCodexCaptures(directory, [{ ...record, width: 3456 }], [image]), /dimensions/);
    assert.throws(() => verifySuppliedCodexCaptures(directory, [record], [{ ...image, width: 3456 }]), /Guide metadata/);
    assert.throws(() => verifySuppliedCodexCaptures(directory, [], [image]), /Missing.*provenance/);
    assert.throws(() => verifySuppliedCodexCaptures(directory, [{ ...record, locale: "ru" }], [image]), /path/);
    assert.throws(() => verifySuppliedCodexCaptures(directory, [record, record], [image]), /duplicate/);
    assert.throws(() => verifySuppliedCodexCaptures(directory, [{ ...record, file: "/falcon/docs/../escape.jpg" }], [image]), /path/);
    assert.throws(() => verifySuppliedCodexCaptures(directory, [{ ...record, sourcePng: "../../raw.png" }], [image]), /provenance/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test("supplied capture symlinks cannot escape the public directory", () => {
  const directory = mkdtempSync(join(tmpdir(), "falcon-supplied-media-"));
  const outside = mkdtempSync(join(tmpdir(), "falcon-outside-media-"));
  try {
    mkdirSync(join(directory, "falcon/docs/2026-11"), { recursive: true });
    writeFileSync(join(outside, "capture.jpg"), bytes);
    symlinkSync(join(outside, "capture.jpg"), join(directory, src));
    assert.throws(() => verifySuppliedCodexCaptures(directory, [record], [image]), /remain inside public/);
  } finally { rmSync(directory, { recursive: true, force: true }); rmSync(outside, { recursive: true, force: true }); }
});
