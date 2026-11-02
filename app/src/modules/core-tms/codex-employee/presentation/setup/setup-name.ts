/** Escape every non-alphanumeric host character, including the escape marker itself. */
export function defaultServerName(mcpUrl: string): string {
  try {
    const host = new URL(mcpUrl).host.toLowerCase();
    return host ? `falcon-${Array.from(host, char => /[a-z0-9]/.test(char) ? char : `_${char.charCodeAt(0).toString(16).padStart(2, "0")}`).join("")}` : "";
  } catch { return ""; }
}
export function validServerName(name: string): boolean {
  return /^[A-Za-z0-9_][A-Za-z0-9_-]*$/.test(name);
}
