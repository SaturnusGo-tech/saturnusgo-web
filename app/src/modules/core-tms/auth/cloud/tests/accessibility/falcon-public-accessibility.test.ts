import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import { falconProductImage } from "../../../../../core-falcon-public/shared/product-images";
import { INTEGRATIONS } from "../../../../presentation/hooks/catalog/integration-definitions";

import { htmlLanguageForPath, isFalconPublicPath } from "../../../../../../shared/_components/route-flags";

const root = process.cwd();

test("Falcon landing owns its language independently from company entry", () => {
  for (const pathname of ["/signup", "/signup/", "/cloud-login/", "/login/", "/trial-terms/"]) {
    assert.equal(isFalconPublicPath(pathname), true);
    assert.equal(htmlLanguageForPath(pathname, "en"), "ru");
  }
  assert.equal(htmlLanguageForPath("/", "ru"), "en");
  assert.equal(htmlLanguageForPath("/", "es", "ru"), "ru");
  assert.equal(isFalconPublicPath("/testcases/umbrella-home/work/"), false);
  assert.equal(htmlLanguageForPath("/partners/", "es"), "es");
});

test("Falcon landing exposes accessible product navigation and a single public entry", () => {
  const direction = readFileSync(resolve(root, "app/src/modules/core-falcon-public/direction/FalconDirection.tsx"), "utf8");
  const landing = readFileSync(resolve(root, "app/src/modules/core-falcon-public/landing/FalconLanding.tsx"), "utf8");
  assert.match(direction, /href="#main-content"/);
  assert.match(direction, /<main id="main-content">/);
  assert.match(direction, /aria-labelledby="direction-title"/);
  assert.match(direction, /aria-label=\{c.product\}/);
  assert.match(direction, /aria-controls="landing-menu"/);
  assert.match(direction, /aria-expanded=\{menu\}/);
  assert.match(direction, /event.key === 'Escape'/);
  assert.match(direction, /\/cloud-login\/\?lang=\$\{locale\}/);
  assert.doesNotMatch(direction + landing, /<video\b|ProductStory|FalconHeroCinema|onWorkflow|onAI|view=workflow/);
});

test("current product scenes have valid localized captures", () => {
  for (const locale of ["en", "ru"] as const) for (const name of ["repository", "suites", "dashboard", "run", "integrations", "codex"] as const) {
    const capture = falconProductImage(name, locale);
    assert.match(capture.src, new RegExp(`/2026-11/${locale}/product-${name}\\.webp$`));
    const image = readFileSync(resolve(root, `public${capture.src}`));
    assert.equal(image.subarray(8, 12).toString(), "WEBP", `${locale}/${name}: invalid capture`);
    assert.ok(image.length > 1000, `${locale}/${name}: empty capture`);
    assert.match(capture.compactSrc, new RegExp(`/2026-11/${locale}/product-${name}-1152\\.webp$`));
    const compact = readFileSync(resolve(root, `public${capture.compactSrc}`));
    assert.equal(compact.subarray(8, 12).toString(), "WEBP", `${locale}/${name}: invalid compact capture`);
    assert.ok(compact.length > 1000 && compact.length < image.length, `${locale}/${name}: compact capture size`);
  }
});

test("landing shows the complete canonical integration catalog with accessible motion controls", () => {
  const marquee = readFileSync(resolve(root, "app/src/modules/core-falcon-public/direction/DirectionMarquee.tsx"), "utf8");
  assert.deepEqual(INTEGRATIONS.map(({ name }) => name).sort(), [
    "Codex", "Confluence", "GitHub", "GitLab", "Jenkins", "Jira", "Linear", "Slack", "Swagger", "TeamCity", "Trello", "YouTrack",
  ]);
  assert.match(marquee, /import\s*\{\s*INTEGRATIONS\s*\}\s*from[^;]*integration-definitions/);
  assert.match(marquee, /const rows = \[INTEGRATIONS\]/);
  assert.match(marquee, /aria-hidden=\{duplicate \|\| undefined\}/);
  assert.match(marquee, /aria-pressed=\{paused\}/);
  assert.match(marquee, /aria-label=\{paused \? resume : pause\}/);
  assert.doesNotMatch(marquee, /Скоро/);
  const youTrackMark = resolve(root, "public/falcon/integrations/youtrack.svg");
  assert.equal(existsSync(youTrackMark), true);
  assert.ok(statSync(youTrackMark).size > 0);
});

test("company entry uses one rounded input surface with neutral outer focus", () => {
  const styles = readFileSync(resolve(root,
    "app/src/modules/core-falcon-public/company-entry/presentation/companyEntry.module.css"), "utf8");
  assert.match(styles, /\.field:focus-within/);
  assert.match(styles, /border-radius:13px/);
  assert.match(styles, /prefers-reduced-motion/);
});

test("landing marquee retains canonical names, YouTrack artwork and working pause controls", async () => {
  const { componentHarness, invoke, nodes } = await import("../../../../portfolios/tests/support/component-harness");
  const document = { hidden: false, addEventListener() {}, removeEventListener() {} };
  const h = componentHarness(undefined, { document });
  const { DirectionMarquee } = h.load<{ DirectionMarquee: (props: { title: string; note: string; pause: string; resume: string }) => unknown }>(new URL("../../../../../core-falcon-public/direction/DirectionMarquee.tsx", import.meta.url), name => {
    if (name.endsWith("integration-definitions")) return { INTEGRATIONS };
  });
  const render = () => h.render(() => DirectionMarquee({ title: "Connected tools", note: "Integration catalog", pause: "Pause", resume: "Resume" }));
  const tree = render();
  const items = nodes(tree).filter(node => node.type === "li");
  assert.equal(items.length, INTEGRATIONS.length * 2);
  for (const { name } of INTEGRATIONS) assert.ok(items.some(node => (node.props.children as unknown[]).includes(name)), name);
  const codex = items.find(node => (node.props.children as unknown[]).includes("Codex"))!;
  const youtrack = items.find(node => (node.props.children as unknown[]).includes("YouTrack"))!;
  assert.equal(nodes(codex).some(node => node.props.src === "/falcon/integrations/youtrack.svg"), false);
  assert.ok(nodes(youtrack).some(node => node.props.src === "/falcon/integrations/youtrack.svg"));
  const pause = nodes(tree).find(node => node.type === "button" && node.props["aria-label"] === "Pause")!;
  assert.equal(pause.props["aria-pressed"], false);
  invoke(pause, "onClick");
  const paused = nodes(render()).find(node => node.type === "button")!;
  assert.equal(paused.props["aria-label"], "Resume");
  assert.equal(paused.props["aria-pressed"], true);
  invoke(paused, "onClick");
  assert.equal(nodes(render()).find(node => node.type === "button")!.props["aria-pressed"], false);
});
