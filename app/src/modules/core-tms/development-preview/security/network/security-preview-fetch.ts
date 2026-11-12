/** Permit development framework reads only; every other request stays in the read-only fixture. */
export function securityPreviewFetch(origin: string, fixture: typeof fetch, previous: typeof fetch): typeof fetch {
  return async (input, init) => {
    const request = input instanceof Request ? input : null;
    (init?.signal ?? request?.signal)?.throwIfAborted();
    const url = new URL(request?.url ?? String(input), origin);
    const method = (init?.method ?? request?.method ?? "GET").toUpperCase();
    const frameworkPath = url.pathname.startsWith("/_next/") || url.pathname === "/work/security-preview"
      || url.pathname.startsWith("/work/security-preview/");
    if (url.origin === origin && !url.username && !url.password && method === "GET" && frameworkPath) return previous(input, init);
    return fixture(input, init);
  };
}
