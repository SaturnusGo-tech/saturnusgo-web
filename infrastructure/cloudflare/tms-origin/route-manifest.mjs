export const TMS_HOST = "tms.saturnusgo.com";
export const SOURCE_ORIGIN = "https://www.saturnusgo.com";
export const ORIGIN_NAMESPACE = "/tms-origin";
export const RELEASE_EVIDENCE_PATH = `${ORIGIN_NAMESPACE}/release.json`;
export const APP_PATH = "/testcases/umbrella-home/work/";

export const publicRoutes = Object.freeze([
  Object.freeze({ publicPath: "/privacy/", artifactPath: "privacy/index.html", required: true }),
  Object.freeze({ publicPath: "/trial-terms/", artifactPath: "trial-terms/index.html", required: true }),
  ...["sandbox", "admin", "profile"].map((name) => Object.freeze({ publicPath: `/${name}/`, artifactPath: `${name}/index.html`, required: true })),
  Object.freeze({ publicPath: "/", artifactPath: "index.html", required: true }),
  Object.freeze({ publicPath: "/ru/", artifactPath: "ru/index.html", required: true }),
  Object.freeze({ publicPath: "/docs/", artifactPath: "docs/index.html", required: true }),
  Object.freeze({ publicPath: "/ru/docs/", artifactPath: "ru/docs/index.html", required: true }),
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
  "/falcon/landing/2026-11/falcon-line-mark.svg",
  ...["coverage", "agents", "release"].map((id) => `/falcon/landing/2026-11/concept-${id}.webp`),
  ...["repository", "suites", "dashboard", "run", "integrations", "codex"].map((id) => `/falcon/landing/2026-11/product-${id}.webp`),
  ...["Regular", "RegularItalic", "Medium", "Semibold", "Bold"].map((weight) => `/falcon/docs/fonts/OpenAISans-${weight}.woff2`),
  "/assets/integrations/codex/codex-light.png",
  "/assets/integrations/codex/codex-dark.png",
  ...["hero-preview", "hero-velvet", "repository-stage", "run-stage", "ai-stage"].map((id) => `/falcon/landing/2026-10/${id}.png`),
  "/falcon/falcon-mark-dark.png",
  "/falcon/falcon-mark-light.png",
  "/falcon/auth/silver-wing.webp",
  "/falcon/impact/ai-paused-20261018.webp",
  "/falcon/landing/2026-09/falcon-wing.webp",
  "/falcon/landing/2026-09/atmosphere.webp",
  ...["projects-20260913", "cases", "runs-20260917", "suites-20260917", "defects", "dashboard", "youtrack-20260913"].flatMap((id) =>
    ["mp4", "webp", "vtt"].map((extension) => `/falcon/landing/2026-09-production/${id}.${extension}`),
  ),
  ...["mp4", "webp", "vtt"].map((extension) => `/falcon/landing/2026-09-english-natural/youtrack-navigation.${extension}`),
  ...["dashboard-direct", "youtrack-cycle-direct"].flatMap((id) =>
    ["mp4", "webp", "vtt"].map((extension) => `/falcon/landing/2026-09-english-natural/${id}.${extension}`),
  ),
  ...["projects", "cases", "runs", "suites", "defects", "dashboard", "youtrack"].flatMap((id) =>
    ["mp4", "webp", "vtt"].map((extension) => `/falcon/landing/2026-09-english-final/${id}.${extension}`),
  ),
]);

export const publicMetadataFiles = Object.freeze([
  "/favicon.ico",
  "/robots.txt",
  "/site.webmanifest",
]);
