import { TMS_HOST } from "../route-manifest.mjs";

export function companyHost(hostname, env) {
  if (env?.FALCON_MANAGED_AUTH_ENABLED !== "true") return null;
  const zone = env.FALCON_COMPANY_DOMAIN_SUFFIX;
  const platform = env.FALCON_PLATFORM_HOSTNAME;
  if (typeof zone !== "string" || typeof platform !== "string" ||
    !/^[a-z0-9.-]+$/.test(zone) || !platform.endsWith(`.${zone}`)) return null;
  if (hostname === platform) return "platform";
  if (hostname === TMS_HOST && env.FALCON_LEGACY_HOST_MANAGED === "true") return "tenant";
  const suffix = `-falcon.${zone}`;
  if (!hostname.endsWith(suffix)) return null;
  const slug = hostname.slice(0, -suffix.length);
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 2 && slug.length <= 48 ? "tenant" : null;
}

export function gatewayError(status, code) {
  return Response.json({ error: { code, message: "The request could not be completed.", requestId: crypto.randomUUID() } },
    { status, headers: { "cache-control": "private, no-store, no-transform", "x-content-type-options": "nosniff" } });
}
