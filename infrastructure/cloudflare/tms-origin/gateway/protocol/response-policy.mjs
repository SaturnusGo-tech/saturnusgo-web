import { protocolRoutePolicy } from "./route-policy.mjs";
import { readConsentPolicy } from "./security/read-consent-policy.mjs";

const issuer = "/api/v1/falcon-oauth";
const redirectStatuses = new Set([302, 303, 307, 308]);
const protocolHeaders = ["www-authenticate", "mcp-session-id", "mcp-protocol-version"];

function safeRedirect(location, requestUrl) {
  if (!location) return false;
  try {
    const target = new URL(location, requestUrl);
    if (target.username || target.password) return false;
    return target.protocol === "https:" || (target.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(target.hostname));
  } catch { return false; }
}

export function protocolResponsePolicy(request, response, audience) {
  const policy = protocolRoutePolicy(new URL(request.url).pathname, audience);
  const allowRedirect = policy?.kind === "oauth" && redirectStatuses.has(response.status) &&
    safeRedirect(response.headers.get("location"), request.url);
  return {
    allowRedirect,
    headers: [...(policy?.kind === "mcp" ? protocolHeaders : allowRedirect ? ["location"] : []),
      ...(readConsentPolicy(request, response, audience) ? ["content-security-policy"] : [])],
    permitsCookie(cookie) {
      if (policy?.kind !== "oauth" || /;\s*domain\s*=/i.test(cookie) ||
        !/;\s*secure(?:;|$)/i.test(cookie) || !/;\s*httponly(?:;|$)/i.test(cookie) ||
        !/;\s*samesite=lax(?:;|$)/i.test(cookie)) return false;
      const name = cookie.slice(0, cookie.indexOf("="));
      if (!policy.cookieNames.includes(name)) return false;
      const path = /;\s*path=([^;]+)/i.exec(cookie)?.[1];
      return typeof path === "string" && (path === issuer || path.startsWith(`${issuer}/`)) &&
        !path.split("/").some(part => part === "." || part === "..");
    },
  };
}
