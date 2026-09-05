import {
  APP_PATH,
  ORIGIN_NAMESPACE,
  publicAssetPrefixes,
  publicMetadataFiles,
  publicRoutes,
  SOURCE_ORIGIN,
  TMS_HOST,
} from "./route-manifest.mjs";

const APP_PATH_NO_SLASH = APP_PATH.slice(0, -1);
const FORWARDED_HEADERS = [
  "accept",
  "accept-encoding",
  "accept-language",
  "cache-control",
  "if-modified-since",
  "if-none-match",
  "range",
  "user-agent",
];
const AUTH_CALLBACK_PARAMETERS = [
  "code",
  "state",
  "error",
  "error_description",
  "error_uri",
];
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https://*.r2.cloudflarestorage.com",
  "media-src 'self' blob: https://*.r2.cloudflarestorage.com",
  "connect-src 'self' https://api.tms.saturnusgo.com " +
    "https://dev-4v1srvqwzp1m7cdl.us.auth0.com https://*.r2.cloudflarestorage.com",
  "frame-src blob: https://sieger-assistente-production.up.railway.app " +
    "https://*.r2.cloudflarestorage.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");
const SECURITY_HEADERS = Object.freeze({
  "content-security-policy": CONTENT_SECURITY_POLICY,
  "permissions-policy": "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
  "referrer-policy": "strict-origin-when-cross-origin",
  "strict-transport-security": "max-age=31536000; includeSubDomains",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
});
const REDIRECT_STATUSES = new Set([301, 302, 307, 308]);
const PASS_THROUGH_STATUSES = new Set([200, 206, 304]);

const routeByPublicPath = new Map(publicRoutes.map((route) => [route.publicPath, route]));

function routeForRequestPath(pathname) {
  const direct = routeByPublicPath.get(pathname);
  if (direct) return direct;
  if (!pathname.endsWith("/index.txt")) return null;
  const routePath = pathname.slice(0, -"index.txt".length);
  return routeByPublicPath.get(routePath) ?? null;
}

function redirectToCanonicalPath(url, pathname) {
  url.pathname = pathname;
  return secureResponse(Response.redirect(url.toString(), 302));
}

function secureResponse(response) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function notFoundResponse() {
  return secureResponse(new Response("Not found", {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8" },
  }));
}

function hasExpectedContentType(pathname, response) {
  if (response.status === 304) return true;
  const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
  if (!contentType) return false;
  const route = routeForRequestPath(pathname);
  if (route) {
    return pathname.endsWith("/index.txt")
      ? contentType.startsWith("text/plain") || contentType.startsWith("text/x-component")
      : contentType.startsWith("text/html");
  }
  if (pathname === APP_PATH) return contentType.startsWith("text/html");
  if (pathname === `${APP_PATH}index.txt`) {
    return contentType.startsWith("text/plain") || contentType.startsWith("text/x-component");
  }

  const extension = pathname.slice(pathname.lastIndexOf(".") + 1).toLowerCase();
  if (["js", "mjs"].includes(extension)) {
    return contentType.startsWith("application/javascript") || contentType.startsWith("text/javascript");
  }
  if (extension === "css") return contentType.startsWith("text/css");
  if (["json", "map", "webmanifest"].includes(extension)) {
    return contentType.startsWith("application/json")
      || contentType.startsWith("application/manifest+json");
  }
  if (["png", "jpg", "jpeg", "gif", "webp", "avif", "svg", "ico"].includes(extension)) {
    return contentType.startsWith("image/");
  }
  if (["woff", "woff2", "ttf", "otf", "eot"].includes(extension)) {
    return contentType.startsWith("font/") || contentType.startsWith("application/font-");
  }
  if (extension === "txt") return contentType.startsWith("text/plain");
  return false;
}

function canonicalPublicPath(pathname) {
  if (pathname === APP_PATH_NO_SLASH) return APP_PATH;
  const route = publicRoutes.find(({ publicPath }) => (
    publicPath !== "/" && pathname === publicPath.slice(0, -1)
  ));
  return route?.publicPath ?? null;
}

function originPathFor(pathname) {
  const route = routeForRequestPath(pathname);
  if (route) {
    const suffix = pathname.endsWith("/index.txt") ? "index.txt" : "index.html";
    const directory = route.artifactPath.slice(0, -"index.html".length);
    return `${ORIGIN_NAMESPACE}/${directory}${suffix}`;
  }
  if (pathname.startsWith(APP_PATH)) return pathname;
  if (publicAssetPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return pathname;
  }
  if (publicMetadataFiles.includes(pathname)) return pathname;
  return null;
}

function publicPathForOrigin(pathname) {
  if (!pathname.startsWith(`${ORIGIN_NAMESPACE}/`)) return originPathFor(pathname) ? pathname : null;
  const artifactPath = pathname.slice(ORIGIN_NAMESPACE.length + 1);
  const route = publicRoutes.find(({ artifactPath: candidate }) => (
    artifactPath === candidate || artifactPath === candidate.replace(/index\.html$/, "index.txt")
  ));
  if (!route) return null;
  return artifactPath.endsWith("index.txt")
    ? `${route.publicPath}index.txt`.replace("//", "/")
    : route.publicPath;
}

async function proxyToPublicSite(request, incoming, originPath) {
  const upstream = new URL(originPath + incoming.search, SOURCE_ORIGIN);
  if (incoming.pathname.startsWith(APP_PATH)) {
    for (const parameter of AUTH_CALLBACK_PARAMETERS) upstream.searchParams.delete(parameter);
  }
  const headers = new Headers();
  for (const name of FORWARDED_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const upstreamResponse = await fetch(new Request(upstream.toString(), {
    method: request.method,
    headers,
    redirect: "manual",
  }));
  const responseHeaders = new Headers(upstreamResponse.headers);
  responseHeaders.delete("set-cookie");
  const location = responseHeaders.get("location");

  if (REDIRECT_STATUSES.has(upstreamResponse.status) && location) {
    const redirected = new URL(location, SOURCE_ORIGIN);
    const publicPath = redirected.origin === SOURCE_ORIGIN
      ? publicPathForOrigin(redirected.pathname)
      : null;
    if (!publicPath) return secureResponse(new Response("Bad gateway", { status: 502 }));
    redirected.protocol = "https:";
    redirected.hostname = TMS_HOST;
    redirected.port = "";
    redirected.pathname = publicPath;
    responseHeaders.set("location", redirected.toString());
  } else if (!PASS_THROUGH_STATUSES.has(upstreamResponse.status)) {
    return notFoundResponse();
  } else if (location || !hasExpectedContentType(incoming.pathname, upstreamResponse)) {
    return notFoundResponse();
  }

  return secureResponse(new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  }));
}

export default {
  async fetch(request) {
    const incoming = new URL(request.url);
    if (incoming.hostname !== TMS_HOST) return notFoundResponse();
    if (incoming.protocol === "http:") {
      incoming.protocol = "https:";
      return secureResponse(Response.redirect(incoming.toString(), 308));
    }
    if (incoming.protocol !== "https:") return notFoundResponse();
    // The Pages origin may decode an encoded separator after the allowlist check. Keep the
    // public surface canonical so an allowed prefix cannot be turned into an origin traversal.
    if (incoming.pathname.includes("%") || incoming.pathname.includes("\\")) {
      return notFoundResponse();
    }
    if (!["GET", "HEAD"].includes(request.method)) {
      return notFoundResponse();
    }
    const canonicalPath = canonicalPublicPath(incoming.pathname);
    if (canonicalPath) return redirectToCanonicalPath(incoming, canonicalPath);
    const originPath = originPathFor(incoming.pathname);
    if (!originPath) return notFoundResponse();
    return proxyToPublicSite(request, incoming, originPath);
  },
};
