import { federationRoutePolicy } from "../inbound/federation-policy.mjs";
const issuer = "/api/v1/falcon-oauth";
const publicPosts = new Set([`${issuer}/token`, `${issuer}/reg`, `${issuer}/token/revocation`]);
const cookieNames = Object.freeze(["falcon_mcp_session", "falcon_mcp_interaction", "falcon_mcp_resume"]
  .flatMap(name => [name, `${name}.sig`]));

export function protocolRoutePolicy(pathname, audience) {
  const inbound = federationRoutePolicy(pathname,audience);
  if(inbound) return inbound;
  if (audience !== "tenant") return null;
  if (pathname === "/api/v1/mcp" || pathname === "/api/v1/mcp/resource-metadata") {
    return { kind: "mcp", allowServerPost: true, cookieNames: [] };
  }
  if (pathname === issuer || pathname.startsWith(`${issuer}/`)) {
    return { kind: "oauth", allowServerPost: publicPosts.has(pathname), cookieNames };
  }
  return null;
}
