import type { components } from "../../../../core/tms/generated/tms-api";
export type ApiSource = components["schemas"]["ApiSource"];
export type ApiSourceDraft = components["schemas"]["ApiSourceInput"];
export type ApiContext = { projectIds?: string[]; portfolioId?: string };
export type NamedOption = { id: string; name: string };
export const sourceDraft = (source: ApiSource | null, projectId: string): ApiSourceDraft => source ? {
  name: source.name, sourceUrl: source.sourceUrl, authMode: source.authMode, enabled: source.enabled,
  allProjects: source.allProjects, projectIds: [...source.projectIds], secrets: {},
} : { name: "", sourceUrl: "", authMode: "none", enabled: true, allProjects: false,
  projectIds: projectId ? [projectId] : [], secrets: {} };
export function chooseApiSource(sources: readonly ApiSource[], current: string | null, remembered: string | null) {
  if (current && sources.some(source => source.id === current)) return current;
  if (remembered && sources.some(source => source.id === remembered)) return remembered;
  return sources.length === 1 ? sources[0]!.id : null;
}

export function keepsSourceCredentials(source: ApiSource | null, draft: ApiSourceDraft) {
  if (!source?.credentialsConfigured || source.authMode !== draft.authMode) return false;
  try { return new URL(source.sourceUrl).origin === new URL(draft.sourceUrl).origin; } catch { return false; }
}
