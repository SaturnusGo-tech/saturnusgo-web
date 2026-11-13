export const desktopMarketingPaths = new Set(["/", "/ru", "/ru/"]);

/** Both responses must carry the same cache discriminator for a UA-dependent route. */
export function varyPublicEntry(pathname, headers) {
  if (!desktopMarketingPaths.has(pathname)) return;
  const variants = (headers.get("vary") ?? "").split(",").map(value => value.trim().toLowerCase());
  if (!variants.includes("*") && !variants.includes("user-agent")) headers.append("vary", "User-Agent");
}
