const MAXIMUM_BODY_BYTES = 2 * 1024 * 1024;
const HEX_KEY = /^[a-f0-9]{64}$/;
const encoder = new TextEncoder();
const hex = (buffer) => Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
const digest = async (value) => hex(await crypto.subtle.digest("SHA-256", typeof value === "string" ? encoder.encode(value) : value));

export class GatewayRequestError extends Error {
  constructor(status, code) { super(code); this.status = status; this.code = code; }
}

async function readBody(request) {
  if (!request.body) return new Uint8Array();
  if (Number(request.headers.get("content-length") ?? 0) > MAXIMUM_BODY_BYTES) {
    throw new GatewayRequestError(413, "PAYLOAD_TOO_LARGE");
  }
  const reader = request.body.getReader();
  const chunks = [];
  let length = 0;
  try {
    for (;;) {
      const next = await reader.read();
      if (next.done) break;
      length += next.value.length;
      if (length > MAXIMUM_BODY_BYTES) throw new GatewayRequestError(413, "PAYLOAD_TOO_LARGE");
      chunks.push(next.value);
    }
  } finally { await reader.cancel(); }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
  return result;
}

export async function signedApiRequest(request, env, audience) {
  const incoming = new URL(request.url);
  if (!HEX_KEY.test(env.FALCON_MANAGED_GATEWAY_KEY ?? "")) throw new GatewayRequestError(503, "GATEWAY_UNAVAILABLE");
  const api = new URL(env.FALCON_API_ORIGIN);
  if (api.protocol !== "https:" || api.username || api.password || api.pathname !== "/" || api.search || api.hash ||
    api.hostname === incoming.hostname) throw new GatewayRequestError(503, "GATEWAY_UNAVAILABLE");
  if (!["GET", "HEAD", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"].includes(request.method)) {
    throw new GatewayRequestError(405, "METHOD_NOT_ALLOWED");
  }
  const origin = request.headers.get("origin") ?? "";
  if (!["GET", "HEAD"].includes(request.method) && origin !== incoming.origin) {
    throw new GatewayRequestError(403, "ORIGIN_DENIED");
  }
  const cookieName = audience === "platform" ? "__Host-falcon_platform_session" : "__Host-falcon_tenant_session";
  const cookie = (request.headers.get("cookie") ?? "").split(";").map((part) => part.trim())
    .filter((part) => part.startsWith(`${cookieName}=`)).join("; ");
  const headers = new Headers();
  for (const name of ["accept", "content-type", "user-agent", "if-match", "idempotency-key", "range"]) {
    const value = request.headers.get(name); if (value) headers.set(name, value);
  }
  const requestId = request.headers.get("x-request-id") ?? "";
  headers.set("x-request-id", /^[A-Za-z0-9._:-]{1,128}$/.test(requestId) ? requestId : crypto.randomUUID());
  headers.set("cache-control", "no-store");
  if (origin) headers.set("origin", origin);
  if (cookie) headers.set("cookie", cookie);
  const timestamp = String(Date.now());
  const clientIp = request.headers.get("cf-connecting-ip") ?? "";
  const body = await readBody(request);
  const canonical = JSON.stringify(["falcon-gateway-v1", request.method, incoming.pathname + incoming.search,
    incoming.hostname, timestamp, clientIp, origin, await digest(cookie), await digest(body)]);
  const key = await crypto.subtle.importKey("raw", Uint8Array.from(env.FALCON_MANAGED_GATEWAY_KEY.match(/../g),
    (pair) => parseInt(pair, 16)), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  headers.set("x-falcon-signature", hex(await crypto.subtle.sign("HMAC", key, encoder.encode(canonical))));
  headers.set("x-falcon-time", timestamp);
  headers.set("x-falcon-host", incoming.hostname);
  headers.set("x-falcon-client-ip", clientIp);
  api.pathname = incoming.pathname;
  api.search = incoming.search;
  return new Request(api, { method: request.method, headers, redirect: "manual",
    signal: AbortSignal.timeout(45000), ...(["GET", "HEAD"].includes(request.method) ? {} : { body }) });
}
