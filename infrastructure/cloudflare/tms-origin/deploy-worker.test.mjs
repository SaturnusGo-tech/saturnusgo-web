import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
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

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: options.cwd,
    encoding: "utf8",
    env: options.env ?? process.env,
  });
}

function write(path, value, executable = false) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, value);
  if (executable) chmodSync(path, 0o755);
}

function git(cwd, ...args) {
  const result = run("git", args, { cwd });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  return result.stdout.trim();
}

function createFixture(context) {
  const sandbox = mkdtempSync(join(tmpdir(), "falcon-worker-release-"));
  context.after(() => rmSync(sandbox, { recursive: true, force: true }));
  const source = join(sandbox, "source");
  const bin = join(sandbox, "test-bin");
  const callLog = join(sandbox, "calls.log");
  const workerDir = join(source, "infrastructure/cloudflare/tms-origin");

  write(
    join(source, "scripts/deploy_tms_worker.sh"),
    readFileSync(join(repoRoot, "scripts/deploy_tms_worker.sh"), "utf8"),
    true,
  );
  write(join(source, "package.json"), '{"devDependencies":{"wrangler":"4.129.0"}}\n');
  write(join(workerDir, "wrangler.toml"), 'name = "fixture"\nmain = "worker.mjs"\n');
  write(join(workerDir, "verify-pages-origin-readiness.mjs"), "// fixture\n");
  write(join(workerDir, "worker.mjs"), "export default {};\n");

  write(join(bin, "npm"), `#!/usr/bin/env bash
set -euo pipefail
printf 'npm %s\\n' "$*" >> "$CALL_LOG"
`, true);
  write(join(bin, "node"), `#!/usr/bin/env bash
set -euo pipefail
if [[ "\${1:-}" == "--version" ]]; then echo "v22.18.0"; exit 0; fi
printf 'node %s\\n' "$*" >> "$CALL_LOG"
`, true);
  write(join(source, "node_modules/.bin/wrangler"), `#!/usr/bin/env bash
set -euo pipefail
if [[ "\${1:-}" == "--version" ]]; then echo "wrangler 4.129.0"; exit 0; fi
printf 'wrangler %s\\n' "$*" >> "$CALL_LOG"
if [[ "\${TEST_EXPECT_OAUTH:-}" == "YES" && -n "\${CLOUDFLARE_API_TOKEN:-}\${CF_API_TOKEN:-}\${CLOUDFLARE_API_KEY:-}\${CF_API_KEY:-}" ]]; then exit 90; fi
if [[ "\${1:-}" == "deployments" && "\${TEST_STATUS_FAIL:-}" == "YES" ]]; then exit 91; fi
if [[ "\${1:-}" == "deployments" ]]; then echo "Current Version ID: fixture-version"; fi
if [[ "\${1:-} \${2:-}" == "versions upload" && "$*" != *"--dry-run"* ]]; then echo "Worker Version ID: 11111111-2222-4333-8444-555555555555"; fi
`, true);

  mkdirSync(source, { recursive: true });
  git(source, "init", "-b", "main");
  git(source, "config", "user.name", "TMS Release Test");
  git(source, "config", "user.email", "tms-release-test@example.invalid");
  git(source, "add", ".");
  git(source, "commit", "-m", "fixture: reviewed worker release");
  const sourceSha = git(source, "rev-parse", "HEAD");
  return { bin, callLog, source, sourceSha };
}

function release(fixture, mode, extraEnvironment = {}) {
  return run("bash", [join(fixture.source, "scripts/deploy_tms_worker.sh"), mode], {
    cwd: fixture.source,
    env: {
      ...process.env,
      TMS_WORKER_AUTH_MODE: "token",
      ...extraEnvironment,
      CALL_LOG: fixture.callLog,
      PATH: `${fixture.bin}:${process.env.PATH}`,
      TMS_SOURCE_SHA: fixture.sourceSha,
    },
  });
}

test("prepare binds to a clean reviewed SHA and runs tests and HTTPS readiness before dry-run", (context) => {
  const fixture = createFixture(context);
  const result = release(fixture, "--prepare");

  assert.equal(result.status, 0, result.stderr);
  const calls = readFileSync(fixture.callLog, "utf8").trim().split("\n");
  assert.deepEqual(calls, [
    "npm run test:tms-worker",
    `node ${fixture.source}/infrastructure/cloudflare/tms-origin/verify-pages-origin-readiness.mjs --source-sha ${fixture.sourceSha}`,
    "wrangler versions upload --config wrangler.toml --keep-vars --dry-run",
  ]);
  assert.match(result.stdout, /Worker release prepared \(no deployment\)/);
  assert.match(result.stdout, new RegExp(`source_sha=${fixture.sourceSha}`));
});

test("fails before checks when the reviewed source checkout is dirty", (context) => {
  const fixture = createFixture(context);
  write(join(fixture.source, "unreviewed.txt"), "dirty\n");

  const result = release(fixture, "--prepare");

  assert.equal(result.status, 6);
  assert.match(result.stderr, /must be clean/);
});

test("publish requires explicit approval and a Cloudflare token", (context) => {
  const fixture = createFixture(context);
  const unapproved = release(fixture, "--publish", {
    CLOUDFLARE_API_TOKEN: "",
    TMS_WORKER_RELEASE_APPROVED: "",
  });
  assert.equal(unapproved.status, 11);
  assert.match(unapproved.stderr, /TMS_WORKER_RELEASE_APPROVED=YES/);

  writeFileSync(fixture.callLog, "");
  const missingToken = release(fixture, "--publish", {
    CLOUDFLARE_API_TOKEN: "",
    TMS_WORKER_RELEASE_APPROVED: "YES",
  });
  assert.equal(missingToken.status, 12);
  assert.match(missingToken.stderr, /CLOUDFLARE_API_TOKEN/);
});

test("publish deploys only after gates and prints version evidence", (context) => {
  const fixture = createFixture(context);
  const result = release(fixture, "--publish", {
    CLOUDFLARE_API_TOKEN: "fixture-secret",
    TMS_WORKER_RELEASE_APPROVED: "YES",
  });

  assert.equal(result.status, 0, result.stderr);
  const calls = readFileSync(fixture.callLog, "utf8");
  assert.match(calls, /npm run test:tms-worker[\s\S]*node .*verify-pages-origin-readiness[\s\S]*wrangler versions upload --config wrangler\.toml --keep-vars --message/);
  assert.match(calls, /wrangler versions deploy 11111111-2222-4333-8444-555555555555@100% --config wrangler\.toml --yes/);
  assert.match(calls, /verify-domain-bindings\.mjs snapshot[\s\S]*versions upload[\s\S]*versions deploy[\s\S]*verify-domain-bindings\.mjs verify/);
  assert.doesNotMatch(calls, /wrangler (?:deploy |triggers )/);
  assert.match(calls, /wrangler deployments status --config wrangler\.toml/);
  assert.match(result.stdout, /Worker Version ID: 11111111-2222-4333-8444-555555555555/);
  assert.match(result.stdout, /Worker production release evidence/);
  assert.match(result.stdout, /deploy_output_sha256=[0-9a-f]{64}/);
  assert.doesNotMatch(`${result.stdout}${result.stderr}`, /fixture-secret/);
});

test("explicit OAuth mode verifies configured Worker access before publishing without token variables", (context) => {
  const fixture = createFixture(context);
  const result = release(fixture, "--publish", {
    TMS_WORKER_AUTH_MODE: "oauth", TMS_WORKER_RELEASE_APPROVED: "YES", TEST_EXPECT_OAUTH: "YES",
    CLOUDFLARE_API_TOKEN: "unused-token", CF_API_TOKEN: "unused-token",
    CLOUDFLARE_API_KEY: "unused-key", CF_API_KEY: "unused-key",
  });
  assert.equal(result.status, 0, result.stderr);
  const calls = readFileSync(fixture.callLog, "utf8");
  assert.match(calls, /verify-pages-origin-readiness[\s\S]*wrangler deployments status --config wrangler\.toml[\s\S]*wrangler versions upload --config/);
  assert.equal(calls.match(/wrangler deployments status/g)?.length, 2);
  assert.match(result.stdout, /auth_mode=oauth/);
  assert.doesNotMatch(`${result.stdout}${result.stderr}`, /unused-token|unused-key/);
});

test("OAuth verification failure or an unknown authentication mode stops before deployment", (context) => {
  const fixture = createFixture(context);
  for (const [mode, status] of [["oauth", 14], ["unknown", 13]]) {
    writeFileSync(fixture.callLog, "");
    const result = release(fixture, "--publish", {
      TMS_WORKER_AUTH_MODE: mode, TMS_WORKER_RELEASE_APPROVED: "YES", TEST_STATUS_FAIL: "YES",
      CLOUDFLARE_API_TOKEN: "",
    });
    assert.equal(result.status, status, result.stderr);
    assert.doesNotMatch(readFileSync(fixture.callLog, "utf8"), /wrangler deploy --config/);
    assert.match(result.stderr, mode === "oauth" ? /OAuth cannot read the configured account/ : /must be token or oauth/);
  }
});
