export const TMS_HOST = "tms.saturnusgo.com";
export const SOURCE_ORIGIN = "https://www.saturnusgo.com";
export const ORIGIN_NAMESPACE = "/tms-origin";
export const RELEASE_EVIDENCE_PATH = `${ORIGIN_NAMESPACE}/release.json`;
export const APP_PATH = "/work/";
export const LEGACY_APP_PATH = "/testcases/umbrella-home/work/";

export const publicRoutes = Object.freeze([
  Object.freeze({ publicPath: "/work/notification-preferences/", artifactPath: "work/notification-preferences/index.html", required: true }),
  Object.freeze({ publicPath: "/privacy/", artifactPath: "privacy/index.html", required: true }),
  Object.freeze({ publicPath: "/terms/", artifactPath: "terms/index.html", required: true }),
  Object.freeze({ publicPath: "/billing-terms/", artifactPath: "billing-terms/index.html", required: true }),
  Object.freeze({ publicPath: "/trial-terms/", artifactPath: "trial-terms/index.html", required: true }),
  ...["sandbox", "admin", "profile"].map((name) => Object.freeze({ publicPath: `/${name}/`, artifactPath: `${name}/index.html`, required: true })),
  Object.freeze({ publicPath: "/", artifactPath: "index.html", required: true }),
  Object.freeze({ publicPath: "/ru/", artifactPath: "ru/index.html", required: true }),
  Object.freeze({ publicPath: "/docs/", artifactPath: "docs/index.html", required: true }),
  Object.freeze({ publicPath: "/ru/docs/", artifactPath: "ru/docs/index.html", required: true }),
  Object.freeze({ publicPath: "/contact-support/", artifactPath: "contact-support/index.html", required: true }),
  Object.freeze({ publicPath: "/ru/contact-support/", artifactPath: "ru/contact-support/index.html", required: true }),
  Object.freeze({ publicPath: "/signup/", artifactPath: "signup/index.html", required: true }),
  Object.freeze({
    publicPath: "/cloud-login/",
    artifactPath: "cloud-login/index.html",
    required: true,
  }),
  Object.freeze({ publicPath: "/login/", artifactPath: "login/index.html", required: false }),
]);

export const publicAssetPrefixes = Object.freeze([
  "/_next/",
  "/assets/integrations/codex/",
  "/falcon/",
]);

export const requiredPublicAssets = Object.freeze([
  ...['mika', 'nora', 'ray', 'ada', 'leo', 'lina', 'omar', 'zoe', 'finn', 'maya',
    'kai', 'iris', 'hugo', 'vera', 'ivo', 'yuna', 'sam', 'eva', 'elias', 'ayla']
    .map(id => `/falcon/avatars/v2/${id}.webp`),
  "/falcon/startup/company-setup-tiles-20261106.webp",
  ...["individual", "startup", "enterprise"].map(id => `/falcon/billing/${id}.webp`),
  "/falcon/achievements/01-first-scenario.webp",
  "/falcon/achievements/02-product-map.webp",
  "/falcon/achievements/03-boundary-patrol.webp",
  "/falcon/achievements/04-reverse-move.webp",
  "/falcon/achievements/05-end-to-end-route.webp",
  "/falcon/achievements/06-permissions-under-control.webp",
  "/falcon/achievements/07-regression-remembers.webp",
  "/falcon/achievements/08-common-language.webp",
  "/falcon/achievements/09-suite-architect.webp",
  "/falcon/achievements/10-coverage-works.webp",
  "/falcon/achievements/11-first-result.webp",
  "/falcon/achievements/12-hundred-checks.webp",
  "/falcon/achievements/13-no-gaps.webp",
  "/falcon/achievements/14-smoke-checked.webp",
  "/falcon/achievements/15-regression-assembled.webp",
  "/falcon/achievements/16-precision-on-repeat.webp",
  "/falcon/achievements/17-two-environments.webp",
  "/falcon/achievements/18-two-platforms.webp",
  "/falcon/achievements/19-obstacle-removed.webp",
  "/falcon/achievements/20-evidence-included.webp",
  "/falcon/achievements/21-first-signal.webp",
  "/falcon/achievements/22-keen-eye.webp",
  "/falcon/achievements/23-reproducible.webp",
  "/falcon/achievements/24-important-find.webp",
  "/falcon/achievements/25-before-release.webp",
  "/falcon/achievements/26-link-established.webp",
  "/falcon/achievements/27-recurrence-noticed.webp",
  "/falcon/achievements/28-fixed-and-verified.webp",
  "/falcon/achievements/29-reliable-control.webp",
  "/falcon/achievements/30-closed-loop.webp",
  "/falcon/achievements/31-second-life.webp",
  "/falcon/achievements/32-keeper-of-relevance.webp",
  "/falcon/achievements/33-fixed-at-source.webp",
  "/falcon/achievements/34-second-pair-of-eyes.webp",
  "/falcon/achievements/35-team-support.webp",
  "/falcon/achievements/36-clear-without-author.webp",
  "/falcon/achievements/37-team-suite.webp",
  "/falcon/achievements/38-useful-observation.webp",
  "/falcon/achievements/39-broad-context.webp",
  "/falcon/achievements/40-full-qa-cycle.webp",
  "/falcon/landing/2026-11/falcon-line-mark.svg",
  ...["coverage", "agents", "release"].map((id) => `/falcon/landing/2026-11/concept-${id}.webp`),
  ...["repository", "suites", "dashboard", "run", "integrations", "codex"].map((id) => `/falcon/landing/2026-11/product-${id}.webp`),
  ...["en", "ru"].flatMap((locale) => ["repository", "suites", "dashboard", "run", "integrations", "codex"]
    .map((id) => `/falcon/landing/2026-11/${locale}/product-${id}.webp`)),
  ...["en", "ru"].flatMap((locale) => ["docs", "docs-1152", "docs-overview"]
    .map((id) => `/falcon/landing/2026-11/${locale}/product-${id}.webp`)),
  ...["Regular", "RegularItalic", "Medium", "Semibold", "Bold"].map((weight) => `/falcon/docs/fonts/OpenAISans-${weight}.woff2`),
  "/assets/integrations/codex/codex-light.png",
  "/assets/integrations/codex/codex-dark.png",
  ...["hero-preview", "hero-velvet", "repository-stage", "run-stage", "ai-stage"].map((id) => `/falcon/landing/2026-10/${id}.png`),
  "/falcon/falcon-brand-mark.svg",
  "/falcon/falcon-icon.png",
  "/falcon/falcon-mark-dark.png",
  "/falcon/falcon-mark-light.png",
  "/falcon/favicon.ico",
  "/falcon/auth/silver-wing.webp",
  "/falcon/impact/ai-paused-20261018.webp",
]);

export const publicMetadataFiles = Object.freeze([
  "/favicon.ico",
  "/robots.txt",
  "/site.webmanifest",
]);
