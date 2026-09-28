import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const run = (...args: string[]) => spawnSync(process.execPath, [
  "--import", "tsx", resolve("scripts/documentation-ai/export.ts"), ...args,
], { encoding: "utf8", cwd: process.cwd() });

test("CLI writes a reproducible artifact and check rejects stale or missing output without changing it", () => {
  const directory = mkdtempSync(join(tmpdir(), "falcon-guide-corpus-"));
  const target = join(directory, "nested", "guide-corpus.json");
  try {
    const exported = run("--output", target);
    assert.equal(exported.status, 0, exported.stderr);
    const first = readFileSync(target, "utf8");
    assert.equal(run("--check", target).status, 0);
    assert.equal(run("--output", target).status, 0);
    assert.equal(readFileSync(target, "utf8"), first);
    const stale = first.replace('"version": "', '"version": "changed-');
    writeFileSync(target, stale);
    const mismatch = run("--check", target);
    assert.equal(mismatch.status, 1);
    assert.match(mismatch.stderr, /stale/);
    assert.equal(readFileSync(target, "utf8"), stale);
    assert.equal(run("--check", join(directory, "missing.json")).status, 1);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("CLI requires an explicit target and rejects ambiguous invocation", () => {
  for (const args of [[], ["--output"], ["--check"], ["--output", "--check"], ["--unknown", "x.json"]]) {
    const result = run(...args);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Usage:/);
  }
});
