export const readingRoles = ["workspace_admin", "qa_manager", "tester", "reporter", "viewer"] as const;
export type ReadingRole = typeof readingRoles[number];

/** Server-shaped capability responses for local QA only. */
export function readingAccess(role: ReadingRole) {
  const canPublish = role === "workspace_admin" || role === "qa_manager";
  return { canEdit: canPublish || role === "tester", canPublish, canArchive: true, canDelete: canPublish };
}
