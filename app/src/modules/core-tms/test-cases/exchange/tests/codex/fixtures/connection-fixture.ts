import type { TestContext } from "node:test";
import type { WorkspaceCapabilities } from "../../../../../auth/spaces/capabilities/domain/workspace-capabilities";
import type { PersonalCodexConnection } from "../../../../../codex-employee/domain/model/codex-employee";
export const scopes: PersonalCodexConnection["scopes"] = ["falcon:read", "falcon:cases:create", "falcon:repository:write"];
export const setup: WorkspaceCapabilities = { workspaceId: "w", companyName: "Company", teamAdministrationAvailable: true,
  canConnect: true, readOnly: false, connectionKind: "company", status: "available",
  server: { name: "Falcon", url: "https://tenant.example/api/v1/mcp", resource: "https://tenant.example/api/v1/mcp",
    issuer: "https://tenant.example", connectionName: "falcon", scopes, authentication: "oauth", version: "1" },
  installation: { pluginUrl: "https://chatgpt.com/plugins/falcon-current" } };
export const grant: PersonalCodexConnection = { id: "g", projectIds: ["p"], scopes,
  createdAt: "2026-11-01T00:00:00Z", expiresAt: "2026-11-19T00:00:00Z", revokedAt: null };
export function windowEvents(t: TestContext) {
  const events = new EventTarget();
  const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events) } });
  t.after(() => { if (previous) Object.defineProperty(globalThis, "window", previous); else Reflect.deleteProperty(globalThis, "window"); });
  return events;
}
