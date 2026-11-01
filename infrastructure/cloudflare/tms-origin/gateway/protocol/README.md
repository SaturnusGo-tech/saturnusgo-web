# Falcon Codex protocol boundary

This is a local integration candidate, not a published endpoint or an end-to-end OAuth verification.
It adds narrow protocol exceptions for managed tenant hosts. Ordinary company APIs retain their
same-origin write requirement, Bearer stripping, session-cookie policy and redirect rejection.

## Requests

- Exact `/api/v1/mcp` and `/api/v1/mcp/resource-metadata` requests use gateway v2, including anonymous discovery.
- MCP alone forwards Authorization, MCP-Protocol-Version, Mcp-Session-Id and Last-Event-ID.
- Missing Origin is accepted for POST only on those exact MCP paths and issuer `/token`, `/reg`,
  `/token/revocation`. A supplied foreign Origin is always rejected. Consent/interaction writes remain same-origin.
- Issuer paths are under `/api/v1/falcon-oauth`. They use the unchanged gateway v1 signature.
- Issuer cookie names are `falcon_mcp_session`, `falcon_mcp_interaction`, `falcon_mcp_resume` and
  their `.sig` counterparts. Other request cookies are not newly forwarded.

Gateway v2 signs the JSON array below using the existing gateway HMAC key. Its signature header is
`v2:` followed by the lowercase hexadecimal HMAC-SHA256. SHA-256 fields are lowercase hex.

```text
["falcon-gateway-v2", method, pathnameAndSearch, companyHostname, timestamp,
 clientIp, originOrEmpty, sha256(forwardedCookie), sha256(exactBody), sha256(authorizationOrEmpty)]
```

## Responses and discovery

MCP responses retain WWW-Authenticate and MCP session/version headers. OAuth redirects are accepted
only on issuer routes, with HTTPS or loopback HTTP Location; the backend issuer remains responsible
for matching the registered client redirect URI. OAuth Set-Cookie requires an approved name,
host-only scope, issuer-prefixed Path, Secure, HttpOnly and SameSite=Lax.

Tenant interaction HTML keeps the backend's strict consent CSP, including `script-src 'none'`
and `form-action 'self'` plus the single provider-validated callback origin/path. Chromium applies
`form-action` to the redirect chain after a form POST, so the registered callback must be included.
The gateway accepts this policy only on the exact interaction GET route and rejects wildcard,
credential-bearing, or unsafe callback sources. Ordinary UI/API policies receive no exception.

Only two root metadata aliases are forwarded, for GET/HEAD on tenant hosts:

- `/.well-known/oauth-authorization-server/api/v1/falcon-oauth` → issuer `/.well-known/openid-configuration`.
- `/.well-known/oauth-protected-resource/api/v1/mcp` → `/api/v1/mcp/resource-metadata`.

The normal managed access boundary resumes a single opaque `falconMcpInteraction` value after full
tenant authentication and recovery-code acknowledgement. It navigates only to the fixed same-origin
issuer interaction path. Invalid/duplicate values, ordinary navigation and platform sessions do not resume.

Run `npm run test:tms-worker`, `npm run test:tms-managed`, `npm run typecheck` and
`npm run architecture:tms`. The existing backend feature flag controls endpoint availability;
the gateway does not itself grant access, authenticate MCP tokens or approve OAuth consent.
