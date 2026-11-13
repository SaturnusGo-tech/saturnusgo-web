import { APP_PATH } from "../../../route-manifest.mjs";
import { desktopMarketingPaths } from "./public-entry-cache.mjs";

// The native client appends this versioned marker to its remote-window UA.
// Like the public web desktop detector, include released prerelease builds.
const desktop = /(?:^|\s)FalconDesktop\/\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?(?:\s|$)/;

export function desktopPublicEntry(request) {
  const url = new URL(request.url);
  if (!desktopMarketingPaths.has(url.pathname) || !desktop.test(request.headers.get("user-agent") ?? "")) return null;
  const response = new Response(null, { status: 302, headers: {
    location: new URL(APP_PATH, url.origin).href,
    "cache-control": "private, no-store",
    vary: "User-Agent",
  } });
  return response;
}
