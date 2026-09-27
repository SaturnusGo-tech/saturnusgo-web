import type { TestRunSummary } from "../../../../../core/tms/contracts/legacy-contract";
import type { components } from "../../../../../core/tms/generated/tms-api";
import type { PlatformBuildRequest } from "../../builds/model/platform-build";

export type RunMetadataPatch = Pick<components["schemas"]["RunPatchRequest"], "name" | "description" | "tags" | "ownerIdentityId" | "platformBuilds">;
export type RunEditResource = { data: TestRunSummary; etag: string };
export interface RunEditPort {
  load(runId: string, signal: AbortSignal): Promise<RunEditResource>;
  save(runId: string, patch: RunMetadataPatch, etag: string, key: string): Promise<RunEditResource>;
}
export type RunEditDraft = { name: string; description: string; tags: string; ownerIdentityId: string | null };
export const runEditDraft = (run: TestRunSummary): RunEditDraft => ({ name: run.name, description: run.description ?? "",
  tags: (run.tags ?? []).join(", "), ownerIdentityId: run.ownerIdentityId ?? null });
export const canEditRunMetadata = (run: TestRunSummary) => !run.archivedAt && ["draft", "active", "paused"].includes(run.status);
const builds = (values: readonly PlatformBuildRequest[]) => values.map(value => value.platform === "android"
  ? { platform: value.platform, attachmentId: value.attachmentId, version: value.version?.trim() ?? "" }
  : { platform: value.platform, reference: value.reference.trim() }).sort((a, b) => a.platform.localeCompare(b.platform));
export function metadataPatch(run: TestRunSummary, draft: RunEditDraft, platformBuilds: PlatformBuildRequest[]): RunMetadataPatch {
  const patch: RunMetadataPatch = {};
  if (draft.name.trim() !== run.name) patch.name = draft.name.trim();
  if (draft.description.trim() !== (run.description ?? "")) patch.description = draft.description.trim();
  const tags = draft.tags.split(",").map(tag => tag.trim()).filter(Boolean);
  if (JSON.stringify(tags) !== JSON.stringify(run.tags ?? [])) patch.tags = tags;
  if (draft.ownerIdentityId !== (run.ownerIdentityId ?? null)) patch.ownerIdentityId = draft.ownerIdentityId;
  if (JSON.stringify(builds(platformBuilds)) !== JSON.stringify(builds(run.platformBuilds ?? []))) patch.platformBuilds = platformBuilds;
  return patch;
}
