export const workflowPhases = ["new", "in_progress", "in_review", "done", "on_hold"] as const;
export type WorkflowPhase = typeof workflowPhases[number];
export type ChecklistItem = Readonly<{ id: string; text: string; completed: boolean }>;
export type OrganizationFields = { workflowPhase: WorkflowPhase; checklist: readonly ChecklistItem[] };
export type OrganizationTarget = { workspaceId: string; targetType: "project" | "portfolio"; targetId: string };
export type OrganizationPatch = Partial<OrganizationFields & { name: string; description: string; testingPlan: string; responsibleIdentityId: string | null; portfolioId: string | null }>;
export function validChecklist(value: readonly ChecklistItem[] | null | undefined): boolean {
  const items = value ?? [];
  return Array.isArray(items) && items.length <= 100
    && items.every((item) => item && typeof item.id === "string" && item.id.length > 0 && typeof item.text === "string"
      && item.text.trim().length > 0 && item.text.trim().length <= 500 && typeof item.completed === "boolean")
    && new Set(items.map((item) => item.id)).size === items.length;
}
