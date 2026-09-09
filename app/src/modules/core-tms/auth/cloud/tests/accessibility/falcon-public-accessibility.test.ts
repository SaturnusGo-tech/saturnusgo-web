import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import { htmlLanguageForPath, isFalconPublicPath } from "../../../../../../shared/_components/route-flags";

const root = process.cwd();

test("Falcon public routes keep their Russian document language", () => {
  for (const pathname of ["/", "/signup", "/signup/", "/cloud-login/"]) {
    assert.equal(isFalconPublicPath(pathname), true);
    assert.equal(htmlLanguageForPath(pathname, "en"), "ru");
  }
  assert.equal(isFalconPublicPath("/testcases/umbrella-home/work/"), false);
  assert.equal(htmlLanguageForPath("/partners/", "es"), "es");
});

test("Falcon landing keeps direct login, signup and accessible chapter navigation", () => {
  const header = readFileSync(resolve(root, "app/src/modules/core-falcon-public/landing/FalconHeader.tsx"), "utf8");
  const landing = readFileSync(resolve(root, "app/src/modules/core-falcon-public/landing/FalconLanding.tsx"), "utf8");
  assert.match(header, /href=\{TMS_ADMIN_LOGIN_PATH\}/);
  assert.match(header, /href="\/signup\/"/);
  assert.match(header, /aria-label="Навигация по лендингу"/);
  assert.match(landing, /href="#product">\s*К содержанию/);
  assert.match(landing, /aria-labelledby="overview-title"/);
  assert.match(landing, /aria-label="Возможности Falcon"/);
  assert.doesNotMatch(landing, /analytics-dashboard\.jpg|case-repository\.jpg|run-builder\.jpg/);
});

test("every landing demonstration has a real MP4, poster and timed text", () => {
  for (const id of ["dashboard", "cases", "runs", "defects", "integrations"]) {
    const base = resolve(root, `public/falcon/landing/2026-09/${id}`);
    const video = readFileSync(`${base}.mp4`);
    assert.equal(video.subarray(4, 8).toString(), "ftyp", `${id}: invalid MP4`);
    assert.ok(video.length > 100_000, `${id}: empty recording`);
    assert.ok(video.length < 20_000_000, `${id}: landing video exceeds budget`);
    const poster = readFileSync(`${base}.webp`);
    assert.equal(poster.subarray(8, 12).toString(), "WEBP");
    const captions = readFileSync(`${base}.vtt`, "utf8");
    assert.ok(captions.startsWith("WEBVTT\n"));
    assert.match(captions, /\d\d:\d\d:\d\d\.\d{3} --> \d\d:\d\d:\d\d\.\d{3}/);
  }
});

test("landing describes available connectors without advertising planned services", () => {
  const source = readFileSync(resolve(root, "app/src/modules/core-falcon-public/landing/FalconIntegrations.tsx"), "utf8");
  for (const service of ["YouTrack", "Jira", "Linear", "Trello", "GitHub", "Slack", "Confluence", "Swagger"]) {
    assert.ok(source.includes(service));
  }
  assert.doesNotMatch(source, /запланированы|План интеграций|Sentry/);
  const youTrackMark = resolve(root, "public/falcon/integrations/youtrack.svg");
  assert.equal(existsSync(youTrackMark), true);
  assert.ok(statSync(youTrackMark).size > 0);
});

test("Falcon auth controls use a solid high-contrast focus indicator", () => {
  const styles = readFileSync(resolve(
    root,
    "app/src/modules/core-falcon-public/auth/cloudAuth.module.css",
  ), "utf8");

  assert.match(styles, /\.page :focus-visible \{ outline: 3px solid #171717; outline-offset: 3px; \}/);
  assert.match(styles, /\.password:focus-within \{[^}]*outline: 3px solid #171717/s);
  assert.doesNotMatch(styles, /:focus(?:-visible|-within)?[^}]*outline:\s*0/);
});
