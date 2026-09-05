export const TMS_HOST = "tms.saturnusgo.com";
export const SOURCE_ORIGIN = "https://www.saturnusgo.com";
export const ORIGIN_NAMESPACE = "/tms-origin";
export const RELEASE_EVIDENCE_PATH = `${ORIGIN_NAMESPACE}/release.json`;
export const APP_PATH = "/testcases/umbrella-home/work/";

export const publicRoutes = Object.freeze([
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
  "/falcon/landing/analytics-dashboard.jpg",
  "/falcon/landing/analytics-dashboard-mobile.jpg",
  "/falcon/landing/cinematic-ambient.webp",
  "/falcon/landing/case-defect-link.jpg",
  "/falcon/landing/case-defect-link-mobile.jpg",
  "/falcon/landing/case-repository.jpg",
  "/falcon/landing/case-repository-mobile.jpg",
  "/falcon/landing/run-builder.jpg",
  "/falcon/landing/run-builder-mobile.jpg",
  "/falcon/landing/run-detail.jpg",
  "/falcon/landing/run-detail-mobile.jpg",
]);

export const publicMetadataFiles = Object.freeze([
  "/favicon.ico",
  "/robots.txt",
  "/site.webmanifest",
]);
