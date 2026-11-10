import type { View } from "../../../../state/types/workspace";
export function workspaceViewAllowed(view: View, userCapabilities: readonly string[], managed = false): boolean {
  return view === "hooks" ? managed || userCapabilities.includes("integration:manage")
    : view === "api" ? userCapabilities.includes("integration:read")
    : view === "files" ? userCapabilities.includes("attachment:read")
    : view === "custom-fields" ? userCapabilities.includes("project:read") : true;
}

/** Project-independent navigation remains separate from view and company authorization. */
export function workspaceViewDisabledWithoutProject(view: View, disabled: boolean, allowManagedHooks: boolean): boolean {
  return disabled && view !== "portfolios" && view !== "api" && view !== "files" && !(allowManagedHooks && view === "hooks");
}
