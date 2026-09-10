const reserved = new Set(["sandbox", "admin", "www", "api", "mail", "support"]);

export function companyAddress(input: string, suffix: string): string | null {
  const zone = suffix.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:[.-][a-z0-9]+)+$/.test(zone)) return null;
  let value = input.trim().toLowerCase();
  if (!value || value.length > 253 || /[\s\\?#@%]/.test(value)) return null;
  if (value.includes(".") || value.includes(":")) {
    try {
      const url = new URL(value.includes("://") ? value : `https://${value}`);
      if (url.protocol !== "https:" || url.username || url.password || url.port || url.pathname !== "/") return null;
      const tail = `-falcon.${zone}`;
      if (!url.hostname.endsWith(tail)) return null;
      value = url.hostname.slice(0, -tail.length);
    } catch { return null; }
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) || value.length < 2 || value.length > 48 || reserved.has(value)) return null;
  return `https://${value}-falcon.${zone}/`;
}
