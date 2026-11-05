import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { deflateSync } from "node:zlib";
import test from "node:test";

const frontend = resolve(__dirname, "../../.."), key = "test-capture";
const oldSrc = "/falcon/docs/2026-11/test-capture-en-production20261103.jpg";
const registryPath = "app/src/modules/core-tms/documentation/content/walkthroughs/media/screenshots.production.json";
const provenancePath = "public/falcon/docs/2026-11/production-provenance.json";
const aliasesPath = "app/src/modules/core-tms/documentation/model/visual/compatibility/production-aliases-en.json";
const legacyAlias = { locale: "en", articleId: "test", sectionId: "flow", id: "legacy-capture",
  src: "/falcon/docs/2026-09/legacy-capture.jpg", currentId: oldSrc.split("/").pop()!.slice(0, -4), currentSrc: oldSrc };

// A complete PNG fixture lets the CLI use the real image decoder and transcoder.
function png(width = 3456, height = 2234) {
  const chunk = (type: string, data: Buffer) => {
    const payload = Buffer.concat([Buffer.from(type), data]); let crc = 0xffffffff;
    for (const byte of payload) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
    const length = Buffer.alloc(4), checksum = Buffer.alloc(4); length.writeUInt32BE(data.length); checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
    return Buffer.concat([length, payload, checksum]);
  };
  const header = Buffer.alloc(13); header.writeUInt32BE(width); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", header),
    chunk("IDAT", deflateSync(Buffer.alloc((width * 3 + 1) * height))), chunk("IEND", Buffer.alloc(0))]);
}

function fixture(run: (directory: string) => void) {
  const directory = mkdtempSync(join(tmpdir(), "falcon-capture-import-"));
  const write = (path: string, data: string | Buffer) => { mkdirSync(dirname(join(directory, path)), { recursive: true }); writeFileSync(join(directory, path), data); };
  try {
    write(registryPath, JSON.stringify({ [key]: { src: oldSrc, width: 3456, height: 2234 } }));
    write(provenancePath, JSON.stringify({ schemaVersion: 1, captures: [{ file: oldSrc, historical: true }] }));
    write(aliasesPath, JSON.stringify([legacyAlias]));
    write(`public${oldSrc}`, "untouched historical capture");
    write("public/falcon/docs/2026-11/codex-provenance.json", JSON.stringify({ files: [] }));
    mkdirSync(join(directory, "public/falcon/docs/2026-09"), { recursive: true });
    mkdirSync(join(directory, "public/falcon/docs/2026-09-ru"), { recursive: true });
    write("raw.png", png());
    write("app/src/modules/core-tms/documentation/content/catalog.ts", `import images from './walkthroughs/media/screenshots.production.json';
      export const docArticles = [{id:'test',sections:[{id:'flow',blocks:[{kind:'walkthrough',steps:[{title:'State',instruction:'Observe',result:'Visible',image:{...images['${key}'],alt:'State'}}]}]}]}];`);
    run(directory);
  } finally { rmSync(directory, { recursive: true, force: true }); }
}
function invoke(directory: string, extra: string[] = []) {
  const result = spawnSync(join(frontend, "node_modules/.bin/tsx"), [join(frontend, "scripts/documentation-captures/import.ts"),
    "--locale", "en", "--key", key, "--raw", join(directory, "raw.png"), "--origin", "https://umbrella-falcon.saturnusgo.com",
    "--source-url", "https://umbrella-falcon.saturnusgo.com/testcases/umbrella-home/work/?view=cases", "--release-sha", "a".repeat(40),
    "--captured-at", "2026-11-05T10:00:00Z", ...extra], { cwd: directory, encoding: "utf8" });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}
const language = ["--ui-locale", "en", "--content-language", "en"];
const json = (directory: string, path: string) => JSON.parse(readFileSync(join(directory, path), "utf8"));

test("replacing a capture requires explicit approval and leaves the registry untouched otherwise", () => fixture(directory => {
  const result = invoke(directory, language);
  assert.notEqual(result.status, 0); assert.match(result.output, /replace-existing/i);
  assert.equal(json(directory, registryPath)[key].src, oldSrc);
}));

test("an explicit replacement publishes a fresh basename and preserves saved-link history", () => fixture(directory => {
  const result = invoke(directory, [...language, "--replace-existing"]);
  assert.equal(result.status, 0, result.output);
  const image = json(directory, registryPath)[key], captures = json(directory, provenancePath).captures;
  assert.match(image.src, /production20261105\.jpg$/);
  assert.equal(readFileSync(join(directory, `public${oldSrc}`), "utf8"), "untouched historical capture");
  assert.equal(captures.length, 2); assert.equal(captures[0].file, oldSrc);
  assert.equal(captures[1].uiLocale, "en"); assert.equal(captures[1].contentLanguage, "en");
  const aliases = json(directory, aliasesPath);
  assert.equal(aliases.find((alias: { src: string }) => alias.src === legacyAlias.src).currentSrc, image.src);
  assert.equal(aliases.find((alias: { src: string }) => alias.src === oldSrc).currentSrc, image.src);
  assert.equal(aliases.length, 2);
  const duplicate = invoke(directory, [...language, "--replace-existing"]);
  assert.notEqual(duplicate.status, 0); assert.match(duplicate.output, /already exists|fresh|versioned/i);
  assert.equal(json(directory, provenancePath).captures.length, 2);
}));

test("replacement rejects missing and mismatched UI or case-content language metadata", () => fixture(directory => {
  for (const flags of [[], ["--ui-locale", "en", "--content-language", "ru"], ["--ui-locale", "ru", "--content-language", "en"]]) {
    const result = invoke(directory, [...flags, "--replace-existing"]);
    assert.notEqual(result.status, 0); assert.match(result.output, /language|ui-locale/i);
    assert.equal(json(directory, provenancePath).captures.length, 1);
  }
}));

test("a documented mixed-language capture imports honestly without claiming full language verification", () => fixture(directory => {
  const reason = "Immutable English GitHub commit summaries in the localized Falcon interface.";
  const result = invoke(directory, ["--ui-locale", "en", "--content-language", "mixed", "--language-exception", `  ${reason}  `, "--replace-existing"]);
  assert.equal(result.status, 0, result.output);
  const capture = json(directory, provenancePath).captures[1];
  assert.equal(capture.contentLanguage, "mixed");
  assert.equal(capture.uiLocale, "en");
  assert.equal(capture.languageException, reason);
  assert.equal(JSON.parse(result.output).languageVerified, false);
}));

test("language exceptions cannot omit a reason or bypass a UI or ordinary content-language mismatch", () => fixture(directory => {
  const reason = "Immutable external text.";
  for (const flags of [
    ["--ui-locale", "en", "--content-language", "mixed"],
    ["--ui-locale", "en", "--content-language", "mixed", "--language-exception", "  "],
    ["--ui-locale", "en", "--content-language", "mixed", "--language-exception"],
    ["--ui-locale", "ru", "--content-language", "mixed", "--language-exception", reason],
    ["--ui-locale", "en", "--content-language", "ru", "--language-exception", reason],
  ]) {
    const result = invoke(directory, [...flags, "--replace-existing"]);
    assert.notEqual(result.status, 0); assert.match(result.output, /language|ui-locale/i);
    assert.equal(json(directory, provenancePath).captures.length, 1);
  }
}));

test("repeated replacements keep every exact historical link pointed at the latest capture", () => fixture(directory => {
  assert.equal(invoke(directory, [...language, "--replace-existing"]).status, 0);
  const first = json(directory, registryPath)[key].src;
  const result = invoke(directory, [...language, "--replace-existing", "--name", "test-capture-retake-20261105"]);
  assert.equal(result.status, 0, result.output);
  const latest = json(directory, registryPath)[key].src, aliases = json(directory, aliasesPath);
  assert.notEqual(latest, first);
  assert.equal(aliases.length, 3);
  for (const source of [legacyAlias.src, oldSrc, first]) {
    assert.equal(aliases.find((alias: { src: string }) => alias.src === source).currentSrc, latest);
  }
  assert.equal(json(directory, provenancePath).captures.length, 3);
  assert.ok(readFileSync(join(directory, `public${first}`)).length);
}));

test("replacement rejects an unrelated --replaces source and an unversioned filename", () => fixture(directory => {
  for (const flags of [["--replaces", "/falcon/docs/2026-11/unrelated.jpg"], ["--name", "stable-image"]]) {
    const result = invoke(directory, [...language, "--replace-existing", ...flags]);
    assert.notEqual(result.status, 0); assert.match(result.output, /replaces|version|date/i);
    assert.equal(json(directory, registryPath)[key].src, oldSrc);
  }
}));

test("replacement retains the raw native geometry guard", () => fixture(directory => {
  writeFileSync(join(directory, "raw.png"), png(1728, 1117));
  const result = invoke(directory, [...language, "--replace-existing"]);
  assert.notEqual(result.status, 0); assert.match(result.output, /3456/);
  assert.equal(json(directory, registryPath)[key].src, oldSrc);
}));
