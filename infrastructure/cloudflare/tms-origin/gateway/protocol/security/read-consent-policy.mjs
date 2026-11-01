/** Preserve only the backend's restrictive, interaction-specific document policy. */
export function readConsentPolicy(request, response, audience) {
  if (audience !== "tenant" || request.method !== "GET" || response.status !== 200 ||
    !/^\/api\/v1\/falcon-oauth\/interaction\/[A-Za-z0-9_-]{1,128}$/.test(new URL(request.url).pathname) ||
    !/^text\/html(?:;|$)/i.test(response.headers.get("content-type") ?? "")) return null;
  const policy = response.headers.get("content-security-policy") ?? "";
  const source = /^default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; form-action 'self' (https?:\/\/[^\s;,<>"'\\*]+); base-uri 'none'; frame-ancestors 'none'$/.exec(policy)?.[1];
  if (!source) return null;
  try {
    const target = new URL(source);
    if (target.username || target.password || target.search || target.hash || source !== target.href ||
      !/^(?:[a-z0-9][a-z0-9.-]*|\[::1\])$/.test(target.hostname) ||
      !(target.protocol === "https:" || (target.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(target.hostname)))) return null;
    return policy;
  } catch { return null; }
}
