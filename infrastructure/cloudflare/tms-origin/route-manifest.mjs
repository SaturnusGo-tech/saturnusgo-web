export const TMS_HOST = "tms.saturnusgo.com";
export const SOURCE_ORIGIN = "https://www.saturnusgo.com";
export const ORIGIN_NAMESPACE = "/tms-origin";
export const RELEASE_EVIDENCE_PATH = `${ORIGIN_NAMESPACE}/release.json`;
export const APP_PATH = "/testcases/umbrella-home/work/";

export const publicRoutes = Object.freeze([
  ...["sandbox", "admin", "profile"].map((name) => Object.freeze({ publicPath: `/${name}/`, artifactPath: `${name}/index.html`, required: true })),
  Object.freeze({ publicPath: "/", artifactPath: "index.html", required: true }),
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
  "/falcon/",
]);

export const requiredPublicAssets = Object.freeze([
  "/falcon/falcon-mark-dark.png",
  "/falcon/falcon-mark-light.png",
  "/falcon/landing/2026-09/falcon-wing.webp",
  "/falcon/landing/2026-09/atmosphere.webp",
  ...["dashboard", "cases", "runs-smoke", "defects-guided", "youtrack-guided"].flatMap((id) =>
    ["mp4", "webp", "vtt"].map((extension) => `/falcon/landing/2026-09/${id}.${extension}`),
  ),
]);

export const publicMetadataFiles = Object.freeze([
  "/favicon.ico",
  "/robots.txt",
  "/site.webmanifest",
]);
