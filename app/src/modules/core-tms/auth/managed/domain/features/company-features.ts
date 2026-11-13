import type { View } from "../../../../state/types/workspace";

const required: Partial<Record<View, string>> = { dashboard: "analytics", api: "api_testing", hooks: "integrations" };

/** This adapts the server's entitlements for navigation; every API still authorizes independently. */
export function companyViewAvailable(view: View, capabilities?: readonly string[], managed = false): boolean {
  if (managed && view === "hooks") return true;
  if (capabilities === undefined || view === "help" || view === "config" || view === "profile" || view === "team") return true;
  return capabilities.includes("core") && (!required[view] || capabilities.includes(required[view]));
}
