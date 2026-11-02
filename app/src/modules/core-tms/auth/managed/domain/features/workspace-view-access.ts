import type { View } from "../../../../state/types/workspace";
export function workspaceViewAllowed(view: View, userCapabilities: readonly string[], managed = false): boolean {
  return view === "hooks" ? managed || userCapabilities.includes("integration:manage")
    : view === "api" ? userCapabilities.includes("integration:read")
    : view === "custom-fields" ? userCapabilities.includes("project:read") : true;
}
