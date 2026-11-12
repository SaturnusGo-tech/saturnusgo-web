export const LATEST_DESKTOP_RELEASE_PATH = "/falcon/desktop/beta/latest.json";
const MAX_MANIFEST_BYTES = 65_536;

function respond(request, status, body, extra = {}) {
  return new Response(request.method === "HEAD" ? null : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "private, no-store, no-transform",
      "x-content-type-options": "nosniff", ...extra },
  });
}

export async function serveLatestDesktopRelease(request, bucket) {
  if (!["GET", "HEAD"].includes(request.method)) {
    return respond(request, 405, { error: "Method not allowed" }, { allow: "GET, HEAD" });
  }
  try {
    if (!bucket) throw new Error("Missing release storage");
    // Read the pointer directly on every check. Immutable installer objects retain their own cache policy.
    const object = await bucket.get(LATEST_DESKTOP_RELEASE_PATH.slice(1));
    if (!object || !Number.isSafeInteger(object.size) || object.size < 1 || object.size > MAX_MANIFEST_BYTES) {
      throw new Error("Unavailable release manifest");
    }
    const body = await object.text();
    if (new TextEncoder().encode(body).length > MAX_MANIFEST_BYTES) throw new Error("Oversized manifest");
    const release = JSON.parse(body);
    if (!release || typeof release.version !== "string" || typeof release.baseUrl !== "string" ||
      release.channel !== "beta" || !Array.isArray(release.artifacts)) throw new Error("Invalid manifest");
    return respond(request, 200, release);
  } catch {
    return respond(request, 503, { error: "Desktop release information is temporarily unavailable" });
  }
}
