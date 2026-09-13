import type { View } from "../../../../state/types/workspace";
export function workspaceViewAllowed(view: View, userCapabilities: readonly string[]): boolean {
  return view === "hooks" ? userCapabilities.includes("integration:manage")
    : view === "api" ? userCapabilities.includes("integration:read") : true;
}
