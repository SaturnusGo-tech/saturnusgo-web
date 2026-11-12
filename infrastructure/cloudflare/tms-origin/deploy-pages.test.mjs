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
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { requiredPublicAssets } from "./route-manifest.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const require = createRequire(import.meta.url);
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
  const invocationLog = join(sandbox, "npm-invocations.log");

  initializeRepository(source);
  write(join(source, ".gitignore"), "node_modules/\n.env*\nout/\n");
  cpSync(dirname(require.resolve("@next/env/package.json")), join(source, "node_modules/@next/env"), { recursive: true });
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
  write(join(pages, "falcon/landing/2026-09/cases.mp4"), "retired landing recording\n");
  write(join(pages, "testcases/umbrella-home/work/index.html"), "old TMS\n");
  write(join(pages, ".nojekyll"), "");
  git(pages, "add", ".");
  git(pages, "commit", "-m", "fixture: existing Pages site");
  run("git", ["init", "--bare", remote]);
  git(pages, "remote", "add", "origin", expectedPagesRemote);
  git(pages, "config", `url.file://${remote}.insteadOf`, expectedPagesRemote);
  git(pages, "push", "-u", "origin", "main");

  const npmStub = `#!/usr/bin/env node
const { appendFileSync, mkdirSync, rmSync, writeFileSync } = require("node:fs");
const { dirname } = require("node:path");
appendFileSync(process.env.NPM_INVOCATIONS_LOG, process.argv.slice(2).join(" ") + "\\n");
const write = (path, value) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, value);
};
if (process.argv.slice(2).join(" ") === "run clean") {
  rmSync("out", { recursive: true, force: true });
  process.exit(0);
}
if (process.argv.slice(2).join(" ") !== "run build") process.exit(2);
write("out/build-node-env.txt", process.env.NODE_ENV ?? "");
for (const name of ["privacy", "terms", "billing-terms", "trial-terms", "sandbox", "admin", "profile"]) write("out/" + name + "/index.html", "FALCON MANAGED ACCESS");
write("out/ru/index.html", "FALCON RUSSIAN LANDING");
write("out/docs/index.html", "FALCON PUBLIC DOCUMENTATION");
write("out/ru/docs/index.html", "FALCON RUSSIAN PUBLIC DOCUMENTATION");
write("out/contact-support/index.html", "FALCON PUBLIC SUPPORT");
write("out/ru/contact-support/index.html", "FALCON RUSSIAN PUBLIC SUPPORT");
write("out/index.html", "FALCON LANDING\\n");
write("out/index.txt", "FALCON LANDING DATA\\n");
if (process.env.OMIT_SIGNUP !== "1") {
  write("out/signup/index.html", "FALCON SIGNUP\\n");
  write("out/signup/index.txt", "FALCON SIGNUP DATA\\n");
}
write("out/testcases/umbrella-home/work/index.html", "LEGACY WORKSPACE REDIRECT");
write("out/testcases/umbrella-home/work/index.txt", "LEGACY REDIRECT DATA");
write("out/cloud-login/index.html", "FALCON CLOUD LOGIN\\n");
if (process.env.INCLUDE_LOGIN === "1") write("out/login/index.html", "FALCON LOGIN\\n");
write("out/work/index.html", "CURRENT TMS\\n");
write("out/work/index.txt", "CURRENT TMS DATA\\n");
if (process.env.OMIT_NOTIFICATION_PREFERENCES !== "1") {
  write("out/work/notification-preferences/index.html", "FALCON NOTIFICATION PREFERENCES\\n");
  write("out/work/notification-preferences/index.txt", "NOTIFICATION PREFERENCES DATA\\n");
}
write("out/_next/static/chunks/app.js", "static chunk\\n");
write("out/_next/static/css/app.css", process.env.UNCOMPILED_TAILWIND === "1" ? "@tailwind utilities;" : ".w-full { width: 100%; }");
for (const weight of ["Regular", "RegularItalic", "Medium", "Semibold", "Bold"]) if (process.env.OMIT_DOCS_FONT !== weight) write("out/falcon/docs/fonts/OpenAISans-" + weight + ".woff2", "font asset");
for (const theme of ["light", "dark"]) if (process.env.OMIT_CODEX_ASSET !== theme) write("out/assets/integrations/codex/codex-" + theme + ".png", "reviewed " + theme);
write("out/assets/integrations/codex/private.json", "private fixture");
write("out/assets/private.txt", "private fixture");
if (process.env.OMIT_FALCON_ASSET !== "1") write("out/falcon/falcon-mark-dark.png", "falcon mark\\n");
write("out/falcon/falcon-brand-mark.svg", "Falcon master mark");
write("out/falcon/falcon-icon.png", "Falcon icon");
write("out/falcon/favicon.ico", "Falcon favicon");
for (const id of ["hero-preview", "hero-velvet", "repository-stage", "run-stage", "ai-stage"]) write("out/falcon/landing/2026-10/" + id + ".png", "Figma asset");
if (process.env.OMIT_LINE_MARK !== "1") write("out/falcon/landing/2026-11/falcon-line-mark.svg", "Falcon line mark");
for (const path of ${JSON.stringify(requiredPublicAssets.filter(path => path.startsWith("/falcon/achievements/")))}) if (process.env.OMIT_ACHIEVEMENT !== path) write("out" + path, "Approved achievement");
for (const path of ${JSON.stringify(requiredPublicAssets.filter(path => path.startsWith("/falcon/billing/")))}) if (process.env.OMIT_BILLING !== path) write("out" + path, "Billing artwork");
for (const path of ${JSON.stringify(requiredPublicAssets.filter(path => path.startsWith("/falcon/startup/")))}) if (process.env.OMIT_STARTUP !== path) write("out" + path, "Company setup artwork");
for (const id of ["coverage", "agents", "release"]) write("out/falcon/landing/2026-11/concept-" + id + ".webp", "Concept asset");
for (const id of ["repository", "suites", "dashboard", "run", "integrations", "codex"]) write("out/falcon/landing/2026-11/product-" + id + ".webp", "Product screen");
for (const path of ${JSON.stringify(requiredPublicAssets.filter(path => /^\/falcon\/landing\/2026-11\/(en|ru)\/product-/.test(path)))}) if (process.env.OMIT_LOCALIZED_PRODUCT !== path) write("out" + path, "Localized product screen");
write("out/falcon/falcon-mark-light.png", "falcon mark light\\n");
write("out/falcon/auth/silver-wing.webp", "silver wing\\n");
if (process.env.OMIT_IMPACT_BANNER !== "1") write("out/falcon/impact/ai-paused-20261018.webp", "ai paused asset");
write("out/falcon/landing/hero.webp", "falcon hero\\n");
`;
  write(join(bin, "npm"), npmStub);
  chmodSync(join(bin, "npm"), 0o755);

  git(source, "add", ".");
  git(source, "commit", "-m", "fixture: release source");
  const sourceSha = git(source, "rev-parse", "HEAD").stdout.trim();
  return { bin, pages, remote, source, sourceSha, invocationLog };
}

function deploy(fixture, mode, extraEnvironment = {}, cwd = fixture.source) {
  return run("bash", [join(fixture.source, "scripts/deploy_pages.sh"), mode], {
    cwd,
    allowFailure: true,
    env: {
      ...process.env,
      NEXT_PUBLIC_FALCON_KLIPY_APP_KEY: undefined,
      ...extraEnvironment,
      NPM_INVOCATIONS_LOG: fixture.invocationLog,
      PATH: `${fixture.bin}:${process.env.PATH}`,
      TMS_PAGES_REPO: fixture.pages,
      TMS_RELEASE_APPROVED: "YES",
      TMS_SOURCE_SHA: fixture.sourceSha,
    },
  });
}

for (const [label, key] of [["present", "retired-public-klipy-key"], ["empty", ""], ["whitespace-only", " \t\n"]]) {
  test(`rejects ${label} obsolete browser-key configuration before cleaning, building or changing Pages`, (context) => {
    const fixture = createFixture(context);
    write(join(fixture.source, "out/keep.txt"), "previous export\n");
    const pagesHead = git(fixture.pages, "rev-parse", "HEAD").stdout;
    const remoteHead = git(fixture.pages, "ls-remote", "origin", "refs/heads/main").stdout;
    const result = deploy(fixture, "--publish", { NEXT_PUBLIC_FALCON_KLIPY_APP_KEY: key });

    assert.equal(result.status, 18, result.stderr);
    assert.match(result.stderr, /NEXT_PUBLIC_FALCON_KLIPY_APP_KEY.*obsolete.*server/i);
    assert.equal(existsSync(fixture.invocationLog), false);
    assert.equal(readFileSync(join(fixture.source, "out/keep.txt"), "utf8"), "previous export\n");
    assert.equal(readFileSync(join(fixture.source, "app/api/route.ts"), "utf8"), "export const runtime = 'nodejs';\n");
    assert.equal(git(fixture.source, "status", "--porcelain").stdout, "");
    assert.equal(git(fixture.pages, "status", "--porcelain").stdout, "");
    assert.equal(git(fixture.pages, "rev-parse", "HEAD").stdout, pagesHead);
    assert.equal(git(fixture.pages, "ls-remote", "origin", "refs/heads/main").stdout, remoteHead);
    assert.doesNotMatch(result.stdout + result.stderr, /retired-public-klipy-key/);
  });
}

test("production releases ignore obsolete key configuration in test-only environment files", (context) => {
  const fixture = createFixture(context);
  write(join(fixture.source, ".env.test.local"), "NEXT_PUBLIC_FALCON_KLIPY_APP_KEY=test-only-public-key\n");
  const result = deploy(fixture, "--prepare", { NODE_ENV: "test" });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(join(fixture.source, "out/build-node-env.txt"), "utf8"), "production");
  assert.equal(git(fixture.pages, "status", "--porcelain").stdout, "");
  assert.doesNotMatch(result.stdout + result.stderr, /test-only-public-key/);
});

test("obsolete production environment keys fail before building even when called elsewhere", (context) => {
  const fixture = createFixture(context);
  write(join(fixture.source, ".env.production.local"), "NEXT_PUBLIC_FALCON_KLIPY_APP_KEY=retired-file-public-key\n");
  const result = deploy(fixture, "--publish", {}, fixture.pages);
  assert.equal(result.status, 18, result.stderr);
  assert.equal(existsSync(fixture.invocationLog), false);
  assert.equal(git(fixture.pages, "status", "--porcelain").stdout, "");
  assert.doesNotMatch(result.stdout + result.stderr, /retired-file-public-key/);
});

test("a release without browser provider credentials continues through the standard build", (context) => {
  const fixture = createFixture(context);
  write(join(fixture.source, ".env.production.local"), "NEXT_PUBLIC_UNRELATED=local-setting\n");
  const result = deploy(fixture, "--prepare", { NODE_ENV: "test" }, fixture.pages);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(fixture.invocationLog, "utf8"), "run clean\nrun build\n");
  assert.equal(readFileSync(join(fixture.source, "out/build-node-env.txt"), "utf8"), "production");
  assert.equal(git(fixture.pages, "status", "--porcelain").stdout, "");
});

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
  assert.equal(readFileSync(join(fixture.pages, "tms-origin/work/notification-preferences/index.html"), "utf8"),
    "FALCON NOTIFICATION PREFERENCES\n");
  assert.equal(readFileSync(join(fixture.pages, "tms-origin/work/notification-preferences/index.txt"), "utf8"),
    "NOTIFICATION PREFERENCES DATA\n");
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
  assert.equal(readFileSync(join(fixture.pages, "falcon/falcon-brand-mark.svg"), "utf8"), "Falcon master mark");
  assert.equal(readFileSync(join(fixture.pages, "falcon/falcon-icon.png"), "utf8"), "Falcon icon");
  assert.equal(readFileSync(join(fixture.pages, "falcon/favicon.ico"), "utf8"), "Falcon favicon");
  assert.equal(readFileSync(join(fixture.pages, "falcon/landing/hero.webp"), "utf8"), "falcon hero\n");
  assert.equal(readFileSync(join(fixture.pages, "falcon/landing/2026-11/falcon-line-mark.svg"), "utf8"), "Falcon line mark");
  for (const id of ["individual", "startup", "enterprise"]) assert.equal(readFileSync(join(fixture.pages, `falcon/billing/${id}.webp`), "utf8"), "Billing artwork");
  for (const locale of ["en", "ru"]) {
    assert.equal(readFileSync(join(fixture.pages, `falcon/landing/2026-11/${locale}/product-repository.webp`), "utf8"), "Localized product screen");
  }
  assert.equal(existsSync(join(fixture.pages, "falcon/landing/2026-09")), false);
  assert.equal(
    readFileSync(join(fixture.pages, "work/index.html"), "utf8"),
    "CURRENT TMS\n",
  );
  for (const theme of ["light", "dark"]) {
    const path = `assets/integrations/codex/codex-${theme}.png`;
    assert.equal(readFileSync(join(fixture.pages, path), "utf8"), `reviewed ${theme}`);
    assert.equal(git(fixture.pages, "show", `HEAD:${path}`).stdout, `reviewed ${theme}`);
  }
  assert.equal(existsSync(join(fixture.pages, "assets/integrations/codex/private.json")), false);
  assert.equal(existsSync(join(fixture.pages, "assets/private.txt")), false);
  for (const weight of ["Regular", "RegularItalic", "Medium", "Semibold", "Bold"]) {
    assert.equal(readFileSync(join(fixture.pages, `falcon/docs/fonts/OpenAISans-${weight}.woff2`), "utf8"), "font asset");
  }
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

test("a missing notification preferences page blocks publication before Pages changes", (context) => {
  const fixture = createFixture(context);
  const before = git(fixture.pages, "rev-parse", "HEAD").stdout;
  const remoteBefore = git(fixture.pages, "ls-remote", "origin", "refs/heads/main").stdout;
  const result = deploy(fixture, "--publish", { OMIT_NOTIFICATION_PREFERENCES: "1" });
  assert.equal(result.status, 14);
  assert.match(result.stderr, /Required Falcon route is missing.*\/work\/notification-preferences\//);
  assert.equal(git(fixture.pages, "rev-parse", "HEAD").stdout, before);
  assert.equal(git(fixture.pages, "ls-remote", "origin", "refs/heads/main").stdout, remoteBefore);
  assert.equal(readFileSync(join(fixture.pages, "index.html"), "utf8"), "SATURNUSGO ROOT\n");
});

test("fails closed when a manifest-required public asset is absent", (context) => {
  const fixture = createFixture(context);
  const pagesHeadBefore = git(fixture.pages, "rev-parse", "HEAD").stdout.trim();
  const result = deploy(fixture, "--publish", { OMIT_FALCON_ASSET: "1" });

  assert.equal(result.status, 15);
  assert.match(result.stderr, /Required public asset is missing.*falcon-mark-dark\.png/);
  assert.equal(git(fixture.pages, "rev-parse", "HEAD").stdout.trim(), pagesHeadBefore);
});

test("fails closed before publishing when a documentation font is absent", (context) => {
  const fixture = createFixture(context);
  const before = git(fixture.pages, "rev-parse", "HEAD").stdout.trim();
  const result = deploy(fixture, "--publish", { OMIT_DOCS_FONT: "Regular" });
  assert.equal(result.status, 15);
  assert.match(result.stderr, /Required public asset is missing.*OpenAISans-Regular\.woff2/);
  assert.equal(git(fixture.pages, "rev-parse", "HEAD").stdout.trim(), before);
});

test("fails closed before publishing when an approved achievement image is absent", (context) => {
  const fixture = createFixture(context);
  const before = git(fixture.pages, "rev-parse", "HEAD").stdout.trim();
  const result = deploy(fixture, "--publish", { OMIT_ACHIEVEMENT: "/falcon/achievements/40-full-qa-cycle.webp" });
  assert.equal(result.status, 15);
  assert.match(result.stderr, /Required public asset is missing.*40-full-qa-cycle\.webp/);
  assert.equal(git(fixture.pages, "rev-parse", "HEAD").stdout.trim(), before);
});

test("fails closed before publishing when billing artwork is absent", (context) => {
  const fixture = createFixture(context);
  const before = git(fixture.pages, "rev-parse", "HEAD").stdout.trim();
  const result = deploy(fixture, "--publish", { OMIT_BILLING: "/falcon/billing/startup.webp" });
  assert.equal(result.status, 15);
  assert.match(result.stderr, /Required public asset is missing.*billing\/startup\.webp/);
  assert.equal(git(fixture.pages, "rev-parse", "HEAD").stdout.trim(), before);
  assert.equal(git(fixture.pages, "status", "--porcelain").stdout, "");
});

test("fails closed before publishing when company setup artwork is absent", (context) => {
  const fixture = createFixture(context);
  const before = git(fixture.pages, "rev-parse", "HEAD").stdout.trim();
  const result = deploy(fixture, "--publish", { OMIT_STARTUP: "/falcon/startup/company-setup-tiles-20261106.webp" });
  assert.equal(result.status, 15);
  assert.match(result.stderr, /Required public asset is missing.*startup\/company-setup-tiles-20261106\.webp/);
  assert.equal(git(fixture.pages, "rev-parse", "HEAD").stdout.trim(), before);
  assert.equal(git(fixture.pages, "status", "--porcelain").stdout, "");
});

test("fails closed when the current landing brand mark is absent", (context) => {
  const fixture = createFixture(context);
  const pagesHeadBefore = git(fixture.pages, "rev-parse", "HEAD").stdout.trim();
  const result = deploy(fixture, "--publish", { OMIT_LINE_MARK: "1" });

  assert.equal(result.status, 15);
  assert.match(result.stderr, /Required public asset is missing.*falcon-line-mark\.svg/);
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

for (const theme of ["light", "dark"]) test(`fails closed when Codex ${theme} asset is absent`, (context) => {
  const fixture = createFixture(context); const before = git(fixture.pages, "rev-parse", "HEAD").stdout.trim();
  const result = deploy(fixture, "--publish", { OMIT_CODEX_ASSET: theme });
  assert.equal(result.status, 15); assert.match(result.stderr, new RegExp(`Required public asset is missing.*codex-${theme}\\.png`));
  assert.equal(git(fixture.pages, "rev-parse", "HEAD").stdout.trim(), before);
});

test("a missing localized product overlay prevents publication before Pages is modified", (context) => {
  const fixture = createFixture(context), before = git(fixture.pages, "rev-parse", "HEAD").stdout.trim();
  const path = "/falcon/landing/2026-11/ru/product-codex.webp";
  const result = deploy(fixture, "--publish", { OMIT_LOCALIZED_PRODUCT: path });
  assert.equal(result.status, 15);
  assert.match(result.stderr, /Required public asset is missing.*ru\/product-codex\.webp/);
  assert.equal(git(fixture.pages, "rev-parse", "HEAD").stdout.trim(), before);
  assert.equal(git(fixture.pages, "status", "--porcelain").stdout, "");
});

test("rejects an export with uncompiled Tailwind CSS before changing Pages", (context) => {
  const fixture = createFixture(context);
  const pagesHead = git(fixture.pages, "rev-parse", "HEAD").stdout;
  const result = deploy(fixture, "--publish", { UNCOMPILED_TAILWIND: "1" });
  assert.equal(result.status, 17, result.stderr);
  assert.match(result.stderr, /Uncompiled Tailwind directives.*app\.css/s);
  assert.equal(git(fixture.pages, "rev-parse", "HEAD").stdout, pagesHead);
});
