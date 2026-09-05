import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const expectedPagesRemote = "https://github.com/SaturnusGo-tech/saturnusgo-web.github.io.git";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: "utf8",
    env: options.env ?? process.env,
  });
  if (options.allowFailure !== true && result.status !== 0) {
    assert.fail(`${command} ${args.join(" ")} failed\n${result.stdout}\n${result.stderr}`);
  }
  return result;
}

function write(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, value);
}

function git(cwd, ...args) {
  return run("git", args, { cwd });
}

function initializeRepository(path) {
  mkdirSync(path, { recursive: true });
  git(path, "init", "-b", "main");
  git(path, "config", "user.name", "TMS Release Test");
  git(path, "config", "user.email", "tms-release-test@example.invalid");
}

function createFixture(context) {
  const sandbox = mkdtempSync(join(tmpdir(), "falcon-pages-release-"));
  context.after(() => rmSync(sandbox, { recursive: true, force: true }));
  const source = join(sandbox, "source");
  const pages = join(sandbox, "pages");
  const remote = join(sandbox, "pages.git");
  const bin = join(sandbox, "bin");

  initializeRepository(source);
  mkdirSync(join(source, "scripts"), { recursive: true });
  mkdirSync(join(source, "infrastructure/cloudflare/tms-origin"), { recursive: true });
  cpSync(join(repoRoot, "scripts/deploy_pages.sh"), join(source, "scripts/deploy_pages.sh"));
  cpSync(
    join(repoRoot, "infrastructure/cloudflare/tms-origin/route-manifest.mjs"),
    join(source, "infrastructure/cloudflare/tms-origin/route-manifest.mjs"),
  );
  chmodSync(join(source, "scripts/deploy_pages.sh"), 0o755);
  write(join(source, "app/api/route.ts"), "export const runtime = 'nodejs';\n");

  initializeRepository(pages);
  write(join(pages, "index.html"), "SATURNUSGO ROOT\n");
  write(join(pages, "partners/index.html"), "SATURNUSGO PARTNERS\n");
  write(join(pages, "tms-origin/stale.txt"), "stale\n");
  write(join(pages, "tms-origin/login/index.html"), "stale login\n");
  write(join(pages, "falcon/old-brand.png"), "stale brand\n");
  write(join(pages, "falcon/landing/stale.webp"), "stale asset\n");
  write(join(pages, "testcases/umbrella-home/work/index.html"), "old TMS\n");
  write(join(pages, ".nojekyll"), "");
  git(pages, "add", ".");
  git(pages, "commit", "-m", "fixture: existing Pages site");
  run("git", ["init", "--bare", remote]);
  git(pages, "remote", "add", "origin", expectedPagesRemote);
  git(pages, "config", `url.file://${remote}.insteadOf`, expectedPagesRemote);
  git(pages, "push", "-u", "origin", "main");

  const npmStub = `#!/usr/bin/env node
const { mkdirSync, rmSync, writeFileSync } = require("node:fs");
const { dirname } = require("node:path");
const write = (path, value) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, value);
};
if (process.argv.slice(2).join(" ") === "run clean") {
  rmSync("out", { recursive: true, force: true });
  process.exit(0);
}
if (process.argv.slice(2).join(" ") !== "run build") process.exit(2);
write("out/index.html", "FALCON LANDING\\n");
write("out/index.txt", "FALCON LANDING DATA\\n");
if (process.env.OMIT_SIGNUP !== "1") {
  write("out/signup/index.html", "FALCON SIGNUP\\n");
  write("out/signup/index.txt", "FALCON SIGNUP DATA\\n");
}
write("out/cloud-login/index.html", "FALCON CLOUD LOGIN\\n");
if (process.env.INCLUDE_LOGIN === "1") write("out/login/index.html", "FALCON LOGIN\\n");
write("out/testcases/umbrella-home/work/index.html", "CURRENT TMS\\n");
write("out/testcases/umbrella-home/work/index.txt", "CURRENT TMS DATA\\n");
write("out/_next/static/chunks/app.js", "static chunk\\n");
if (process.env.OMIT_FALCON_ASSET !== "1") write("out/falcon/falcon-mark-dark.png", "falcon mark\\n");
write("out/falcon/falcon-mark-light.png", "falcon mark light\\n");
write("out/falcon/landing/analytics-dashboard.png", "analytics\\n");
write("out/falcon/landing/run-execution.png", "run execution\\n");
write("out/falcon/landing/test-case-workspace.png", "case workspace\\n");
write("out/falcon/landing/test-suite-detail.jpg", "suite detail\\n");
write("out/falcon/landing/hero.webp", "falcon hero\\n");
`;
  write(join(bin, "npm"), npmStub);
  chmodSync(join(bin, "npm"), 0o755);

  git(source, "add", ".");
  git(source, "commit", "-m", "fixture: release source");
  const sourceSha = git(source, "rev-parse", "HEAD").stdout.trim();
  return { bin, pages, remote, source, sourceSha };
}

function deploy(fixture, mode, extraEnvironment = {}) {
  return run("bash", [join(fixture.source, "scripts/deploy_pages.sh"), mode], {
    cwd: fixture.source,
    allowFailure: true,
    env: {
      ...process.env,
      ...extraEnvironment,
      PATH: `${fixture.bin}:${process.env.PATH}`,
      TMS_PAGES_REPO: fixture.pages,
      TMS_RELEASE_APPROVED: "YES",
      TMS_SOURCE_SHA: fixture.sourceSha,
    },
  });
}

test("publishes Falcon routes into an isolated namespace without replacing Pages root", (context) => {
  const fixture = createFixture(context);
  const result = deploy(fixture, "--publish");
  assert.equal(result.status, 0, result.stderr);

  assert.equal(readFileSync(join(fixture.pages, "index.html"), "utf8"), "SATURNUSGO ROOT\n");
  assert.equal(
    readFileSync(join(fixture.pages, "partners/index.html"), "utf8"),
    "SATURNUSGO PARTNERS\n",
  );
  assert.equal(
    readFileSync(join(fixture.pages, "tms-origin/index.html"), "utf8"),
    "FALCON LANDING\n",
  );
  assert.equal(
    readFileSync(join(fixture.pages, "tms-origin/signup/index.html"), "utf8"),
    "FALCON SIGNUP\n",
  );
  assert.equal(
    readFileSync(join(fixture.pages, "tms-origin/cloud-login/index.html"), "utf8"),
    "FALCON CLOUD LOGIN\n",
  );
  assert.deepEqual(
    JSON.parse(readFileSync(join(fixture.pages, "tms-origin/release.json"), "utf8")),
    { sourceSha: fixture.sourceSha, routeManifest: "tms-origin-v1" },
  );
  assert.equal(existsSync(join(fixture.pages, "tms-origin/login")), false);
  assert.equal(existsSync(join(fixture.pages, "tms-origin/stale.txt")), false);
  assert.equal(existsSync(join(fixture.pages, "falcon/old-brand.png")), false);
  assert.equal(existsSync(join(fixture.pages, "falcon/landing/stale.webp")), false);
  assert.equal(
    readFileSync(join(fixture.pages, "falcon/falcon-mark-dark.png"), "utf8"),
    "falcon mark\n",
  );
  assert.equal(readFileSync(join(fixture.pages, "falcon/landing/hero.webp"), "utf8"), "falcon hero\n");
  assert.equal(
    readFileSync(join(fixture.pages, "testcases/umbrella-home/work/index.html"), "utf8"),
    "CURRENT TMS\n",
  );
  assert.match(git(fixture.pages, "log", "-1", "--pretty=%s").stdout, /^deploy: TMS /);
  assert.equal(git(fixture.pages, "status", "--porcelain").stdout, "");
});

test("publishes optional login only when its source route exists", (context) => {
  const fixture = createFixture(context);
  const result = deploy(fixture, "--publish", { INCLUDE_LOGIN: "1" });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    readFileSync(join(fixture.pages, "tms-origin/login/index.html"), "utf8"),
    "FALCON LOGIN\n",
  );
});

test("fails closed when a required public route is absent", (context) => {
  const fixture = createFixture(context);
  const rootBefore = readFileSync(join(fixture.pages, "index.html"), "utf8");
  const pagesHeadBefore = git(fixture.pages, "rev-parse", "HEAD").stdout.trim();
  const result = deploy(fixture, "--publish", { OMIT_SIGNUP: "1" });

  assert.equal(result.status, 14);
  assert.match(result.stderr, /Required Falcon route is missing.*\/signup\//);
  assert.equal(readFileSync(join(fixture.pages, "index.html"), "utf8"), rootBefore);
  assert.equal(git(fixture.pages, "rev-parse", "HEAD").stdout.trim(), pagesHeadBefore);
});

test("fails closed when a manifest-required public asset is absent", (context) => {
  const fixture = createFixture(context);
  const pagesHeadBefore = git(fixture.pages, "rev-parse", "HEAD").stdout.trim();
  const result = deploy(fixture, "--publish", { OMIT_FALCON_ASSET: "1" });

  assert.equal(result.status, 15);
  assert.match(result.stderr, /Required public asset is missing.*falcon-mark-dark\.png/);
  assert.equal(git(fixture.pages, "rev-parse", "HEAD").stdout.trim(), pagesHeadBefore);
});

test("fails closed unless the Pages checkout is on main", (context) => {
  const fixture = createFixture(context);
  git(fixture.pages, "switch", "-c", "release-candidate");

  const result = deploy(fixture, "--prepare");

  assert.equal(result.status, 8);
  assert.match(result.stderr, /must be on main/);
});

test("fails closed when Pages origin is not the reviewed GitHub repository", (context) => {
  const fixture = createFixture(context);
  git(fixture.pages, "remote", "set-url", "origin", `file://${fixture.remote}`);

  const result = deploy(fixture, "--prepare");

  assert.equal(result.status, 9);
  assert.match(result.stderr, /must be SaturnusGo-tech\/saturnusgo-web\.github\.io/);
});

test("fails closed when local Pages main is not exactly origin/main", (context) => {
  const fixture = createFixture(context);
  write(join(fixture.pages, "local-only.txt"), "not reviewed\n");
  git(fixture.pages, "add", "local-only.txt");
  git(fixture.pages, "commit", "-m", "fixture: local-only commit");

  const result = deploy(fixture, "--prepare");

  assert.equal(result.status, 11);
  assert.match(result.stderr, /not exactly synchronized/);
});
