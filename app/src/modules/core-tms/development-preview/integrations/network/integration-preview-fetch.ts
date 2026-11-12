/** Keep local framework reads working, but never forward integration traffic from the fixture. */
export function integrationPreviewFetch(origin: string, fixture: typeof fetch, previous: typeof fetch): typeof fetch {
  return async (input, init) => {
    const request = input instanceof Request ? input : null;
    (init?.signal ?? request?.signal)?.throwIfAborted();
    const url = new URL(request?.url ?? String(input), origin);
    const method = (init?.method ?? request?.method ?? "GET").toUpperCase();
    const frameworkPath = url.pathname.startsWith("/_next/") || url.pathname === "/work/integration-preview"
      || url.pathname.startsWith("/work/integration-preview/");
    if (url.origin === origin && !url.username && !url.password && method === "GET" && frameworkPath) return previous(input, init);
    return fixture(input, init);
  };
}
