const AUDIO_PATH = /^\/falcon\/docs\/audio\/ru\/[a-z0-9]+(?:-[a-z0-9]+)*\/[a-f0-9]{64}\.mp3$/;
const IMMUTABLE_CACHE = "public, max-age=31536000, immutable";

function failure(request, status, message, extraHeaders = {}) {
  return new Response(request.method === "HEAD" ? null : message, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", ...extraHeaders },
  });
}

function matchesEtag(value, etag) {
  return value?.split(",").some((candidate) => {
    const normalized = candidate.trim();
    return normalized === "*" || normalized.replace(/^W\//, "") === etag;
  }) ?? false;
}

function byteRange(value, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (!match || (!match[1] && !match[2])) return null;
  const first = match[1] ? Number(match[1]) : null;
  const last = match[2] ? Number(match[2]) : null;
  if ([first, last].some((part) => part !== null && !Number.isSafeInteger(part))) return null;
  if (first === null) {
    if (last === 0) return null;
    const length = Math.min(last, size);
    return { offset: size - length, length };
  }
  if (first >= size || (last !== null && last < first)) return null;
  return { offset: first, length: Math.min(last ?? size - 1, size - 1) - first + 1 };
}

function canApplyRange(value, object) {
  if (!value) return true;
  if (value.startsWith('"') || value.startsWith("W/")) return value === object.httpEtag;
  const date = Date.parse(value);
  return Number.isFinite(date) && Math.floor(object.uploaded.getTime() / 1000) * 1000 <= date;
}

export async function serveDocsAudio(request, bucket) {
  const pathname = new URL(request.url).pathname;
  if (!AUDIO_PATH.test(pathname)) return failure(request, 404, "Not found");
  if (!["GET", "HEAD"].includes(request.method)) {
    return failure(request, 405, "Method not allowed", { allow: "GET, HEAD" });
  }
  if (!bucket) return failure(request, 503, "Documentation audio is unavailable");
  try {
    const key = pathname.slice(1);
    const object = await bucket.head(key);
    if (!object) return failure(request, 404, "Documentation audio was not found");
    if (!Number.isSafeInteger(object.size) || object.size < 1 ||
      object.httpMetadata?.contentType !== "audio/mpeg" ||
      !/^"[^"\r\n]+"$/.test(object.httpEtag) ||
      !(object.uploaded instanceof Date) || !Number.isFinite(object.uploaded.getTime())) {
      return failure(request, 502, "Documentation audio metadata is invalid");
    }
    const headers = new Headers({
      "content-type": "audio/mpeg",
      "content-disposition": "inline",
      "content-length": String(object.size),
      "accept-ranges": "bytes",
      "cache-control": IMMUTABLE_CACHE,
      "etag": object.httpEtag,
      "last-modified": object.uploaded.toUTCString(),
    });
    if (matchesEtag(request.headers.get("if-none-match"), object.httpEtag)) {
      headers.delete("content-length");
      return new Response(null, { status: 304, headers });
    }
    // HTTP Range applies to GET; a HEAD response describes the complete representation.
    if (request.method === "HEAD") return new Response(null, { headers });
    const requestedRange = request.headers.get("range");
    let range;
    if (requestedRange && canApplyRange(request.headers.get("if-range"), object)) {
      range = byteRange(requestedRange, object.size);
      if (!range) return failure(request, 416, "Requested audio range is not satisfiable", {
        "accept-ranges": "bytes", "content-range": `bytes */${object.size}`,
      });
      headers.set("content-length", String(range.length));
      headers.set("content-range", `bytes ${range.offset}-${range.offset + range.length - 1}/${object.size}`);
    }
    const result = await bucket.get(key, {
      onlyIf: { etagMatches: object.etag }, ...(range ? { range } : {}),
    });
    if (!result || !result.body || result.httpEtag !== object.httpEtag || result.size !== object.size ||
      (range && (result.range?.offset !== range.offset || result.range?.length !== range.length))) {
      return failure(request, 503, "Documentation audio changed during retrieval; retry the request");
    }
    return new Response(result.body, { status: range ? 206 : 200, headers });
  } catch {
    return failure(request, 503, "Documentation audio is temporarily unavailable");
  }
}
