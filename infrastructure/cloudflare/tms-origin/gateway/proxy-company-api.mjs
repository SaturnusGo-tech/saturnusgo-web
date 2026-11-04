import { accountSpaceCookieAllowed } from "./account-spaces/cookie-policy.mjs";
import { desktopResponsePolicy } from "./desktop/desktop-policy.mjs";
import { federationResponsePolicy } from "./inbound/federation-policy.mjs";
import { signedApiRequest, GatewayRequestError } from "./signed-api-request.mjs";
import { gatewayError } from "./company-host.mjs";
import { protocolResponsePolicy } from "./protocol/response-policy.mjs";

const RESPONSE_HEADERS = ["content-type", "content-disposition", "content-length", "content-range", "accept-ranges",
  "etag", "x-request-id", "x-next-cursor", "idempotency-replayed", "retry-after"];

export async function proxyCompanyApi(request, env, audience, send = fetch) {
  try {
    const response = await send(await signedApiRequest(request, env, audience));
    const protocol = desktopResponsePolicy(request,response,audience) ?? federationResponsePolicy(request,response,audience,env) ?? protocolResponsePolicy(request, response, audience);
    if (response.status >= 300 && response.status < 400 && !protocol.allowRedirect) return gatewayError(502, "INVALID_API_RESPONSE");
    const headers = new Headers({ "cache-control": "private, no-store, no-transform", "x-content-type-options": "nosniff" });
    for (const name of [...RESPONSE_HEADERS, ...protocol.headers]) {
      const value = response.headers.get(name); if (value) headers.set(name, value);
    }
    const cookies = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() :
      typeof response.headers.getAll === "function" ? response.headers.getAll("set-cookie") :
        response.headers.has("set-cookie") ? [response.headers.get("set-cookie")] : [];
    const name = audience === "personal" ? "__Host-falcon_cloud_session" : audience === "platform" ? "__Host-falcon_platform_session" : "__Host-falcon_tenant_session";
    for (const cookie of cookies) {
      const ordinary = cookie.startsWith(`${name}=`) && !/;\s*domain\s*=/i.test(cookie) &&
        /;\s*path=\/(?:;|$)/i.test(cookie) && /;\s*secure(?:;|$)/i.test(cookie) &&
        /;\s*httponly(?:;|$)/i.test(cookie) && /;\s*samesite=lax(?:;|$)/i.test(cookie);
      if (!ordinary && !protocol.permitsCookie(cookie) && !accountSpaceCookieAllowed(request,audience,cookie)) {
        return gatewayError(502, "INVALID_SESSION_COOKIE");
      }
      headers.append("set-cookie", cookie);
    }
    return new Response(response.body, { status: response.status, headers });
  } catch (error) {
    if (error instanceof GatewayRequestError) return gatewayError(error.status, error.code);
    return gatewayError(503, "GATEWAY_UNAVAILABLE");
  }
}
