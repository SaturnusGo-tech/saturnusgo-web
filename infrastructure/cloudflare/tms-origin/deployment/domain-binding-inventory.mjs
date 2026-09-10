const ACCOUNT = "4b485e3b82c9e0b429aa9aa753c250a7";
const SERVICE = "umbrella-home-tms-origin";
const ZONE = "5f894deaef55311e810151ca7ad30ed3";
const cleanBinding = (value) => {
  if (!value || typeof value.id !== "string" || !/^[a-z0-9.-]+$/.test(value.hostname ?? "") ||
      typeof value.zone_id !== "string" || value.service !== SERVICE) throw new Error("Invalid domain inventory");
  return { id: value.id, hostname: value.hostname, zoneId: value.zone_id, service: value.service,
    environment: value.environment ?? "production" };
};

export async function readDomainBindings(credentials, fetcher = fetch) {
  if (!["oauth", "api_token"].includes(credentials?.type) || typeof credentials.token !== "string" ||
      !credentials.token) throw new Error("A Cloudflare bearer token is required");
  const url = new URL(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/workers/domains`);
  url.searchParams.set("service", SERVICE);
  const response = await fetcher(url, { headers: { authorization: `Bearer ${credentials.token}` },
    signal: AbortSignal.timeout(30_000), redirect: "error" });
  if (!response.ok) throw new Error(`Domain inventory unavailable (HTTP ${response.status})`);
  const body = await response.json();
  if (body.success !== true || !Array.isArray(body.result) || body.result.length > 10_000 ||
      (body.result_info?.total_pages ?? 1) > 1 ||
      (body.result_info?.total_count ?? body.result.length) > body.result.length) {
    throw new Error("Domain inventory is incomplete");
  }
  const bindings = body.result.map(cleanBinding).sort((a, b) => a.hostname.localeCompare(b.hostname));
  if (new Set(bindings.map((item) => item.hostname)).size !== bindings.length ||
      !bindings.some((item) => item.hostname === "tms.saturnusgo.com" && item.zoneId === ZONE)) {
    throw new Error("The existing Falcon domain is missing from the inventory");
  }
  return bindings;
}

export function verifyDomainBindings(before, after) {
  if (!Array.isArray(before) || before.length === 0) throw new Error("Domain snapshot is empty");
  const current = new Map(after.map((item) => [item.hostname, item]));
  const changed = before.filter((item) => {
    const found = current.get(item.hostname);
    return !found || ["id", "zoneId", "service", "environment"].some((key) => found[key] !== item[key]);
  });
  if (changed.length) throw new Error(`Domain binding drift: ${changed.map((item) => item.hostname).join(", ")}`);
}
