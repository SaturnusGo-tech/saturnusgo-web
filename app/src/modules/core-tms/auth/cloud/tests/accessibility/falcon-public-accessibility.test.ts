import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import { demos } from "../../../../../core-falcon-public/landing/content/demos";
import { INTEGRATIONS } from "../../../../presentation/hooks/catalog/integration-definitions";

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

test("Falcon landing has one company login action and accessible chapter navigation", () => {
  const header = readFileSync(resolve(root, "app/src/modules/core-falcon-public/landing/FalconHeader.tsx"), "utf8");
  const landing = readFileSync(resolve(root, "app/src/modules/core-falcon-public/landing/FalconLanding.tsx"), "utf8");
  assert.match(header, /href="\/cloud-login\/"/);
  assert.doesNotMatch(header + landing, /href="\/signup\/"|Создать аккаунт/);
  assert.match(header, /aria-label="Навигация по лендингу"/);
  assert.match(landing, /href="#product">\s*К содержанию/);
  assert.match(landing, /aria-labelledby="overview-title"/);
  assert.match(landing, /aria-label="Возможности Falcon"/);
  assert.doesNotMatch(landing, /analytics-dashboard\.jpg|case-repository\.jpg|run-builder\.jpg/);
});

test("every landing demonstration has a real MP4, poster and timed text", () => {
  assert.equal(demos.integrations.src, "/falcon/landing/2026-09-commercial/youtrack.mp4");
  assert.equal(Object.keys(demos).length, 6);
  for (const { id, src, poster: posterPath, captions: captionsPath } of Object.values(demos)) {
    const video = readFileSync(resolve(root, `public${src}`));
    assert.equal(video.subarray(4, 8).toString(), "ftyp", `${id}: invalid MP4`);
    assert.ok(video.length > 100_000, `${id}: empty recording`);
    assert.ok(video.length < 20_000_000, `${id}: landing video exceeds budget`);
    const poster = readFileSync(resolve(root, `public${posterPath}`));
    assert.equal(poster.subarray(8, 12).toString(), "WEBP");
    const captions = readFileSync(resolve(root, `public${captionsPath}`), "utf8");
    assert.ok(captions.startsWith("WEBVTT\n"));
    assert.match(captions, /\d\d:\d\d:\d\d\.\d{3} --> \d\d:\d\d:\d\d\.\d{3}/);
  }
});

test("landing shows the complete canonical integration catalog with accessible motion controls", () => {
  const section = readFileSync(resolve(root, "app/src/modules/core-falcon-public/landing/FalconIntegrations.tsx"), "utf8");
  const marquee = readFileSync(resolve(root, "app/src/modules/core-falcon-public/landing/motion/IntegrationMarquee.tsx"), "utf8");
  assert.deepEqual(INTEGRATIONS.map(({ name }) => name).sort(), [
    "Confluence", "GitHub", "GitLab", "Jenkins", "Jira", "Linear", "Slack", "Swagger", "TeamCity", "Trello", "YouTrack",
  ]);
  assert.match(section, /<IntegrationMarquee\s*\/>/);
  assert.match(marquee, /import\s*\{\s*INTEGRATIONS\s*\}\s*from[^;]*integration-definitions/);
  assert.match(marquee, /INTEGRATIONS\.map/);
  assert.match(marquee, /aria-label=\{\s*duplicate\s*\?\s*undefined\s*:\s*"Каталог интеграций Falcon"\s*\}/);
  assert.match(marquee, /aria-hidden=\{duplicate \|\| undefined\}/);
  assert.match(marquee, /aria-pressed=\{paused\}/);
  assert.match(marquee, /Остановить строку интеграций/);
  assert.match(marquee, /Запустить строку интеграций/);
  // Planned connectors stay discoverable without claiming they are available.
  for (const id of ["gitlab", "jenkins", "teamcity"]) assert.ok(marquee.includes(`"${id}"`));
  assert.match(marquee, /planned\.has\(id\)[\s\S]*?<small>Скоро<\/small>/);
  const youTrackMark = resolve(root, "public/falcon/integrations/youtrack.svg");
  assert.equal(existsSync(youTrackMark), true);
  assert.ok(statSync(youTrackMark).size > 0);
});

test("video markup requires manual playback and exposes labeled player controls", () => {
  const source = readFileSync(resolve(root, "app/src/modules/core-falcon-public/landing/media/ProductVideo.tsx"), "utf8");
  const video = source.match(/<video\b[^>]*>/s)?.[0];
  assert.ok(video, "Expected a native video element");
  assert.doesNotMatch(video, /\bautoPlay\b|\bautoplay\b|\bloop\b/);
  assert.match(video, /\bplaysInline\b/);
  assert.match(video, /aria-label=\{demo\.title\}/);
  assert.match(source, /Воспроизвести видео: \$\{demo\.title\}/);
  assert.match(source, /Пауза: \$\{demo\.title\}/);
  assert.match(source, /Позиция видео: \$\{demo\.title\}/);
  assert.match(source, /На весь экран: \$\{demo\.title\}/);
  assert.match(source, /kind="captions"/);
  assert.match(source, /<summary>Что в видео<\/summary>/);
});

test("company entry uses one rounded input surface with neutral outer focus", () => {
  const styles = readFileSync(resolve(root,
    "app/src/modules/core-falcon-public/company-entry/presentation/companyEntry.module.css"), "utf8");
  assert.match(styles, /\.field:focus-within/);
  assert.match(styles, /border-radius:13px/);
  assert.match(styles, /prefers-reduced-motion/);
});
