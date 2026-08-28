const TMS_HOST = "tms.saturnusgo.com";
const SOURCE_ORIGIN = "https://www.saturnusgo.com";
const APP_PATH = "/testcases/umbrella-home/work/";
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

function isAllowedSourcePath(pathname) {
  return pathname.startsWith(APP_PATH)
    || pathname.startsWith("/_next/")
    || pathname.startsWith("/cdn-cgi/")
    || pathname.startsWith("/mock/")
    || pathname === "/favicon.ico"
    || pathname === "/robots.txt"
    || pathname === "/site.webmanifest";
}

function redirectToCanonicalPath(url) {
  url.pathname = APP_PATH;
  return Response.redirect(url.toString(), 302);
}

async function proxyToPublicSite(request, incoming) {
  const upstream = new URL(incoming.pathname + incoming.search, SOURCE_ORIGIN);
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
  const location = responseHeaders.get("location");

  if (location) {
    const redirected = new URL(location, SOURCE_ORIGIN);
    if (redirected.origin === SOURCE_ORIGIN) {
      redirected.protocol = incoming.protocol;
      redirected.hostname = TMS_HOST;
      redirected.port = "";
      responseHeaders.set("location", redirected.toString());
    }
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
}

export default {
  async fetch(request) {
    const incoming = new URL(request.url);
    if (incoming.hostname !== TMS_HOST || !["GET", "HEAD"].includes(request.method)) {
      return new Response("Not found", { status: 404 });
    }
    if (incoming.pathname === "/" || incoming.pathname === APP_PATH_NO_SLASH) {
      return redirectToCanonicalPath(incoming);
    }
    if (!isAllowedSourcePath(incoming.pathname)) {
      return new Response("Not found", { status: 404 });
    }
    return proxyToPublicSite(request, incoming);
  },
};
