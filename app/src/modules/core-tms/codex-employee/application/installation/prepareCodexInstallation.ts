import type { CodexEmployee } from "../../domain/model/codex-employee";
export { CODEX_PLUGIN_VERSION } from "../../domain/model/codex-plugin";

const supportedScopes = new Set(Object.keys({
  "falcon:read": true,
  "falcon:cases:create": true,
  "falcon:runs:create": true,
  "falcon:cases:write": true,
  "falcon:repository:write": true,
  "falcon:suites:write": true,
  "falcon:environments:write": true,
  "falcon:runs:manage": true,
  "falcon:execution:write": true,
  "falcon:defects:write": true,
  "falcon:attachments:write": true,
  "falcon:workflows:write": true,
  "falcon:catalog:write": true,
  "falcon:dashboards:write": true,
  "falcon:projects:manage": true,
  "falcon:dashboard-preferences:write": true,
  "falcon:dashboard-reminders:write": true,
  offline_access: true,
} satisfies Record<CodexEmployee["setup"]["scopes"][number], true>));

function companyEndpoint(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash)
    throw new Error("Falcon requires an HTTPS connection without credentials, query parameters or fragments.");
  return url;
}
/** Validate internal registration only. No network, files, host installation or OAuth activation. */
export async function prepareCodexInstallation(setup: CodexEmployee["setup"]): Promise<void> {
  if (setup.version !== "1" || setup.authentication !== "oauth") throw new Error("Unsupported Falcon connection configuration.");
  const mcp = companyEndpoint(setup.mcpUrl), resource = companyEndpoint(setup.resource), issuer = companyEndpoint(setup.oauthIssuer);
  if (mcp.origin !== resource.origin || mcp.origin !== issuer.origin) throw new Error("Falcon connection URLs must belong to the same company origin.");
  if (!Array.isArray(setup.scopes) || setup.scopes.some(scope => !supportedScopes.has(scope))) {
    throw new Error("Unsupported Falcon authorization scope.");
  }
}
