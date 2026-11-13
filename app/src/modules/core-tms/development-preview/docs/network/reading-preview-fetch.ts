/** Only local framework GETs may leave this fixture; product requests never reach a server. */
export function readingPreviewFetch(origin: string, previous: typeof fetch): typeof fetch {
  return async (input, init) => {
    const request = input instanceof Request ? input : null;
    (init?.signal ?? request?.signal)?.throwIfAborted();
    const url = new URL(request?.url ?? String(input), origin);
    const method = (init?.method ?? request?.method ?? "GET").toUpperCase();
    const framework = url.pathname.startsWith("/_next/") || url.pathname === "/work/docs-reading-preview"
      || url.pathname.startsWith("/work/docs-reading-preview/");
    if (url.origin === origin && !url.username && !url.password && method === "GET" && framework) return previous(input, init);
    throw new Error("Local Docs preview blocks outbound product requests.");
  };
}
