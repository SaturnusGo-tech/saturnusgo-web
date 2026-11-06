import {workspaceHandoffOriginAllowed} from "./workspace-handoff/relay-policy.mjs";
import { protocolRoutePolicy } from "./protocol/route-policy.mjs";
import {accountSpaceRequestCookieNames} from "./account-spaces/cookie-policy.mjs";

const MAXIMUM_BODY_BYTES = 2 * 1024 * 1024;
const HEX_KEY = /^[a-f0-9]{64}$/;
const encoder = new TextEncoder();
const hex = (buffer) => Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
const digest = async (value) => hex(await crypto.subtle.digest("SHA-256", typeof value === "string" ? encoder.encode(value) : value));

export class GatewayRequestError extends Error {
  constructor(status, code) { super(code); this.status = status; this.code = code; }
}

async function readBody(request, maximumBytes) {
  if (!request.body) return new Uint8Array();
  if (Number(request.headers.get("content-length") ?? 0) > maximumBytes) {
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
      if (length > maximumBytes) throw new GatewayRequestError(413, "PAYLOAD_TOO_LARGE");
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
  const protocol = protocolRoutePolicy(incoming.pathname, audience);
  if(protocol?.allowedMethods && !protocol.allowedMethods.includes(request.method)) throw new GatewayRequestError(405,"METHOD_NOT_ALLOWED");
  const dictation = request.method === "POST" &&
    /^\/api\/v1\/workspaces\/[A-Za-z0-9_-]{1,160}\/ai\/(?:dictation|documentation-dictation)$/.test(incoming.pathname);
  if (!HEX_KEY.test(env.FALCON_MANAGED_GATEWAY_KEY ?? "")) throw new GatewayRequestError(503, "GATEWAY_UNAVAILABLE");
  const api = new URL(env.FALCON_API_ORIGIN);
  if (api.protocol !== "https:" || api.username || api.password || api.pathname !== "/" || api.search || api.hash ||
    api.hostname === incoming.hostname) throw new GatewayRequestError(503, "GATEWAY_UNAVAILABLE");
  if (!["GET", "HEAD", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"].includes(request.method)) {
    throw new GatewayRequestError(405, "METHOD_NOT_ALLOWED");
  }
  const origin = request.headers.get("origin") ?? "";
  if (!["GET", "HEAD"].includes(request.method) && origin !== incoming.origin &&
    !(origin === "" && request.method === "POST" && protocol?.allowServerPost) &&
    !(request.method === "POST" && protocol?.allowCrossSitePost && (protocol.kind !== "workspace-handoff" || workspaceHandoffOriginAllowed(origin,env)))) {
    throw new GatewayRequestError(403, "ORIGIN_DENIED");
  }
  const cookieName = audience === "personal" ? "__Host-falcon_cloud_session" : audience === "platform" ? "__Host-falcon_platform_session" : "__Host-falcon_tenant_session";
  const accountSpaceCookies = accountSpaceRequestCookieNames(request, audience);
  const cookie = (request.headers.get("cookie") ?? "").split(";").map((part) => part.trim())
    .filter((part) => part.startsWith(`${cookieName}=`) || (audience === "tenant" && part.startsWith("__Host-falcon_cloud_session=")) ||
      (audience === "personal" && !incoming.pathname.startsWith("/api/v1/auth/") && !incoming.pathname.startsWith("/api/v1/cloud-auth/") && part.startsWith("__Host-falcon_tenant_session=")) ||
      protocol?.cookieNames.includes(part.slice(0, part.indexOf("="))) ||
      accountSpaceCookies.includes(part.slice(0, part.indexOf("=")))).join("; ");
  const headers = new Headers();
  for (const name of ["accept", "content-type", "user-agent", "if-match", "idempotency-key", "range"]) {
    const value = request.headers.get(name); if (value) headers.set(name, value);
  }
  if (protocol?.kind === "mcp") for (const name of ["authorization", "mcp-protocol-version", "mcp-session-id", "last-event-id"]) {
    const value = request.headers.get(name); if (value) headers.set(name, value);
  }
  const language = request.headers.get("accept-language") ?? "";
  if (protocol?.kind === "oauth" && /^\/api\/v1\/falcon-oauth\/interaction\/[^/]+$/.test(incoming.pathname) &&
    language.length <= 256 && /^(?:[A-Za-z]{1,8}(?:-[A-Za-z0-9]{1,8})*|\*)(?:\s*;\s*q=(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?))?(?:\s*,\s*(?:[A-Za-z]{1,8}(?:-[A-Za-z0-9]{1,8})*|\*)(?:\s*;\s*q=(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?))?)*$/.test(language)) {
    headers.set("accept-language", language);
  }
  const requestId = request.headers.get("x-request-id") ?? "";
  headers.set("x-request-id", /^[A-Za-z0-9._:-]{1,128}$/.test(requestId) ? requestId : crypto.randomUUID());
  headers.set("cache-control", "no-store");
  if (origin) headers.set("origin", origin);
  if (cookie) headers.set("cookie", cookie);
  const timestamp = String(Date.now());
  const clientIp = request.headers.get("cf-connecting-ip") ?? "";
  const body = await readBody(request, protocol?.maximumBodyBytes ?? (dictation ? 12_810_000 : MAXIMUM_BODY_BYTES));
  const fields = [protocol?.kind === "mcp" ? "falcon-gateway-v2" : "falcon-gateway-v1", request.method,
    incoming.pathname + incoming.search, incoming.hostname, timestamp, clientIp, origin, await digest(cookie), await digest(body)];
  if (protocol?.kind === "mcp") fields.push(await digest(headers.get("authorization") ?? ""));
  const canonical = JSON.stringify(fields);
  const key = await crypto.subtle.importKey("raw", Uint8Array.from(env.FALCON_MANAGED_GATEWAY_KEY.match(/../g),
    (pair) => parseInt(pair, 16)), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = hex(await crypto.subtle.sign("HMAC", key, encoder.encode(canonical)));
  headers.set("x-falcon-signature", protocol?.kind === "mcp" ? `v2:${signature}` : signature);
  headers.set("x-falcon-time", timestamp);
  headers.set("x-falcon-host", incoming.hostname);
  headers.set("x-falcon-client-ip", clientIp);
  api.pathname = incoming.pathname;
  api.search = incoming.search;
  return new Request(api, { method: request.method, headers, redirect: "manual",
    signal: AbortSignal.any([request.signal, AbortSignal.timeout(dictation ? 130000 : 45000)]),
    ...(["GET", "HEAD"].includes(request.method) ? {} : { body }) });
}
