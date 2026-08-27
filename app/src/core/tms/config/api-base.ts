function isLocalHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized === "0.0.0.0" ||
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("127.") ||
    normalized.startsWith("::ffff:127.")
  );
}

export function resolveTmsApiBase(
  configured: string | undefined,
  production: boolean,
  developmentDefault?: string,
): string {
  const candidate = configured?.trim() || (production ? "" : developmentDefault?.trim());
  if (!candidate) {
    throw new Error(
      "NEXT_PUBLIC_TMS_API_BASE is required for a production TMS build.",
    );
  }

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error("NEXT_PUBLIC_TMS_API_BASE must be an absolute URL.");
  }

  if (production && url.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_TMS_API_BASE must use HTTPS in production.");
  }
  if (production && isLocalHost(url.hostname)) {
    throw new Error("NEXT_PUBLIC_TMS_API_BASE cannot target localhost in production.");
  }
  if (!production && !["http:", "https:"].includes(url.protocol)) {
    throw new Error("NEXT_PUBLIC_TMS_API_BASE must use HTTP or HTTPS.");
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error("NEXT_PUBLIC_TMS_API_BASE cannot contain credentials, query, or hash.");
  }

  return url.toString().replace(/\/$/, "");
}
