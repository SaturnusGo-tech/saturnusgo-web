import { pathToFileURL } from "node:url";
import {
  ORIGIN_NAMESPACE,
  publicAssetPrefixes,
  publicRoutes,
  RELEASE_EVIDENCE_PATH,
  requiredPublicAssets,
  SOURCE_ORIGIN,
} from "./route-manifest.mjs";

const SHA_PATTERN = /^[0-9a-f]{40}$/;
const ASSET_REFERENCE_PATTERN = /\b(?:href|src)\s*=\s*["']([^"']+)["']/gi;

function versionedUrl(origin, pathname, sourceSha, search = "") {
  const url = new URL(pathname + search, origin);
  url.searchParams.set("falcon_release", sourceSha);
  return url;
}

function assertCanonicalPath(pathname, description) {
  if (!pathname.startsWith("/") || pathname.includes("%") || pathname.includes("\\")) {
    throw new Error(`${description} is not a canonical public path: ${pathname}`);
  }
  if (pathname.split("/").some((segment) => segment === "." || segment === "..")) {
    throw new Error(`${description} contains path traversal: ${pathname}`);
  }
}

async function fetchRequired(fetchImpl, url, description, expectedType) {
  let response;
  try {
    response = await fetchImpl(url, {
      headers: {
        accept: expectedType === "html" ? "text/html" : "*/*",
        "cache-control": "no-cache",
      },
      redirect: "error",
    });
  } catch (error) {
    throw new Error(`${description} is unreachable at ${url}: ${error.message}`, { cause: error });
  }
  if (response.status !== 200) {
    throw new Error(`${description} returned ${response.status} at ${url}`);
  }
  const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
  if (expectedType === "html") {
    if (!contentType.startsWith("text/html")) {
      throw new Error(`${description} returned unexpected content-type ${contentType || "missing"}`);
    }
    const text = await response.text();
    if (text.trim().length === 0) throw new Error(`${description} returned an empty document`);
    return text;
  }
  if (expectedType === "json" && !contentType.startsWith("application/json")) {
    throw new Error(`${description} returned unexpected content-type ${contentType || "missing"}`);
  }
  if (expectedType === "asset") {
    const extension = url.pathname.slice(url.pathname.lastIndexOf(".") + 1).toLowerCase();
    const valid = ["js", "mjs"].includes(extension)
      ? contentType.startsWith("application/javascript") || contentType.startsWith("text/javascript")
      : extension === "css"
        ? contentType.startsWith("text/css")
        : ["png", "jpg", "jpeg", "gif", "webp", "avif", "svg", "ico"].includes(extension)
          ? contentType.startsWith("image/")
          : ["woff", "woff2", "ttf", "otf", "eot"].includes(extension)
            ? contentType.startsWith("font/") || contentType.startsWith("application/font-")
            : ["json", "map", "webmanifest"].includes(extension)
              ? contentType.startsWith("application/json")
                || contentType.startsWith("application/manifest+json")
              : false;
    if (!valid) {
      throw new Error(`${description} returned unexpected content-type ${contentType || "missing"}`);
    }
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength === 0) throw new Error(`${description} returned an empty asset`);
  return bytes;
}

function collectRuntimeAssets(html, publicUrl) {
  const assets = new Set();
  for (const match of html.matchAll(ASSET_REFERENCE_PATTERN)) {
    const rawReference = match[1].replaceAll("&amp;", "&");
    let referenced;
    try {
      referenced = new URL(rawReference, publicUrl);
    } catch {
      continue;
    }
    if (![publicUrl.origin, SOURCE_ORIGIN].includes(referenced.origin)) continue;
    if (!publicAssetPrefixes.some((prefix) => referenced.pathname.startsWith(prefix))) continue;
    assertCanonicalPath(referenced.pathname, "HTML asset reference");
    assets.add(`${referenced.pathname}${referenced.search}`);
  }
  return assets;
}

export async function verifyPagesOriginReadiness({
  fetchImpl = globalThis.fetch,
  sourceOrigin = SOURCE_ORIGIN,
  sourceSha,
} = {}) {
  if (!SHA_PATTERN.test(sourceSha ?? "")) {
    throw new Error("A full lowercase 40-character reviewed source SHA is required.");
  }
  const origin = new URL(sourceOrigin);
  if (origin.protocol !== "https:" || origin.pathname !== "/" || origin.search || origin.hash) {
    throw new Error(`Pages source origin must be a bare HTTPS origin: ${sourceOrigin}`);
  }

  const evidenceUrl = versionedUrl(origin, RELEASE_EVIDENCE_PATH, sourceSha);
  const evidenceBytes = await fetchRequired(
    fetchImpl,
    evidenceUrl,
    "Pages release evidence",
    "json",
  );
  let evidence;
  try {
    evidence = JSON.parse(new TextDecoder().decode(evidenceBytes));
  } catch (error) {
    throw new Error("Pages release evidence is not valid JSON.", { cause: error });
  }
  if (evidence.sourceSha !== sourceSha || evidence.routeManifest !== "tms-origin-v1") {
    throw new Error(`Pages release evidence does not match reviewed source SHA ${sourceSha}.`);
  }

  const runtimeAssets = new Set(requiredPublicAssets);
  const checkedRoutes = [];
  for (const route of publicRoutes.filter(({ required }) => required)) {
    assertCanonicalPath(route.publicPath, "Public route");
    const originPath = `${ORIGIN_NAMESPACE}/${route.artifactPath}`;
    const routeUrl = versionedUrl(origin, originPath, sourceSha);
    const html = await fetchRequired(fetchImpl, routeUrl, `Required route ${route.publicPath}`, "html");
    const publicUrl = new URL(route.publicPath, "https://tms.saturnusgo.com");
    for (const asset of collectRuntimeAssets(html, publicUrl)) runtimeAssets.add(asset);
    checkedRoutes.push(route.publicPath);
  }

  if (![...runtimeAssets].some((asset) => asset.startsWith("/_next/"))) {
    throw new Error("Required route HTML does not reference a Next.js runtime asset.");
  }

  const checkedAssets = [];
  for (const asset of [...runtimeAssets].sort()) {
    const assetUrl = new URL(asset, origin);
    assertCanonicalPath(assetUrl.pathname, "Runtime asset");
    const checkUrl = versionedUrl(origin, assetUrl.pathname, sourceSha, assetUrl.search);
    await fetchRequired(fetchImpl, checkUrl, `Required asset ${assetUrl.pathname}`, "asset");
    checkedAssets.push(assetUrl.pathname);
  }

  return Object.freeze({
    sourceOrigin: origin.origin,
    sourceSha,
    checkedRoutes: Object.freeze(checkedRoutes),
    checkedAssets: Object.freeze(checkedAssets),
  });
}

async function main() {
  const shaIndex = process.argv.indexOf("--source-sha");
  const sourceSha = shaIndex >= 0 ? process.argv[shaIndex + 1] : undefined;
  const result = await verifyPagesOriginReadiness({ sourceSha });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write(`Pages-origin readiness failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}
