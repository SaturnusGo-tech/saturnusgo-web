import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { stageAssets } from "../stage.mjs";

const SHA = "c".repeat(40);
async function fixture(context) {
  const directory = await mkdtemp(join(tmpdir(), "falcon-codex-assets-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const source = join(directory, "out");
  const files = ["admin/index.html", "admin/index.txt", "profile/index.html", "profile/index.txt",
    "sandbox/index.html", "sandbox/index.txt", "privacy/index.html", "privacy/index.txt",
    "work/index.html", "work/index.txt",
    "testcases/umbrella-home/work/index.html", "testcases/umbrella-home/work/index.txt",
    "assets/integrations/codex/codex-light.png", "assets/integrations/codex/codex-dark.png",
    "assets/private/no.png", "assets/integrations/codex/unreviewed.png", "_next/static/app.js", "falcon/auth/wing.webp", "falcon/landing/movie.mp4", "favicon.ico"];
  for (const file of files) {
    await mkdir(join(source, file, ".."), { recursive: true });
    await writeFile(join(source, file), `artifact:${file}`);
  }
  return { source, release: join(directory, "release") };
}

test("staging isolates managed pages and excludes marketing media from the uploaded artifact", async (context) => {
  const { source, release } = await fixture(context);
  const manifest = await stageAssets(source, release, SHA);
  assert.equal(await readFile(join(release, "assets/tms-origin/admin/index.html"), "utf8"), "artifact:admin/index.html");
  assert.equal(await readFile(join(release, "assets/testcases/umbrella-home/work/index.html"), "utf8"),
    "artifact:testcases/umbrella-home/work/index.html");
  assert.equal(await readFile(join(release, "assets/work/index.html"), "utf8"), "artifact:work/index.html");
  assert.equal(manifest.entries.some((entry) => entry.path.startsWith("falcon/landing/")), false);
  for (const theme of ["light", "dark"]) {
    const path = `assets/integrations/codex/codex-${theme}.png`;
    assert.equal(await readFile(join(release, "assets", path), "utf8"), `artifact:${path}`);
    assert.match(manifest.entries.find((entry) => entry.path === path).sha256, /^[0-9a-f]{64}$/);
  }
  assert.equal(manifest.entries.some((entry) => entry.path.endsWith("unreviewed.png") || entry.path.includes("private")), false);
  assert.equal(manifest.frontendSourceSha, SHA);
  assert.equal(manifest.fileCount, 17);
  assert.equal((await stageAssets(source, release, SHA)).assetSha256, manifest.assetSha256);
});

test("staging rejects missing routes and symlinks before replacing a prepared artifact", async (context) => {
  const { source, release } = await fixture(context);
  await stageAssets(source, release, SHA);
  const previous = await readFile(join(release, "asset-manifest.json"), "utf8");
  await rm(join(source, "admin/index.html"));
  await assert.rejects(stageAssets(source, release, SHA), /ENOENT/);
  assert.equal(await readFile(join(release, "asset-manifest.json"), "utf8"), previous);
  await symlink(join(source, "profile/index.html"), join(source, "admin/index.html"));
  await assert.rejects(stageAssets(source, release, SHA), /regular file/);
});

test("staging rejects a missing or symlinked Codex mark", async (context) => {
  const { source, release } = await fixture(context);
  const path = join(source, "assets/integrations/codex/codex-light.png");
  await rm(path);
  await assert.rejects(stageAssets(source, release, SHA), /ENOENT/);
  await symlink(join(source, "favicon.ico"), path);
  await assert.rejects(stageAssets(source, release, SHA), /regular file/);
});
