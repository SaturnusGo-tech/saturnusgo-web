import type { components } from "../../../../../core/tms/generated/tms-api";
import type { AttachmentMetadata, AttachmentUploadPhase } from "../../../attachments/domain/attachment";
import { iosReferenceError } from "./ios-reference";

export type RunPlatformBuild = components["schemas"]["RunPlatformBuild"];
export type PlatformBuildRequest = components["schemas"]["RunPlatformBuildInput"];
export type BuildDraft = {
  androidVersion: string; iosReference: string; file: File | null;
  artifact: AttachmentMetadata | null; operationKey: string;
  phase: AttachmentUploadPhase | "idle" | "cancelled"; error: string;
};
export const MAX_BUILD_BYTES = 500 * 1024 * 1024;
export const emptyBuildDraft = (): BuildDraft => ({ androidVersion: "", iosReference: "", file: null,
  artifact: null, operationKey: "", phase: "idle", error: "" });

export function platformBuildError(draft: BuildDraft, projectId: string, ru: boolean): string {
  if (draft.androidVersion.trim().length > 200) return ru ? "Версия Android: до 200 символов." : "Android version: up to 200 characters.";
  if (draft.iosReference.trim().length > 500) return ru ? "Версия или ссылка iOS: до 500 символов." : "iOS version or link: up to 500 characters.";
  const iosError = iosReferenceError(draft.iosReference, ru); if (iosError) return iosError;
  if (draft.file || draft.androidVersion.trim() || draft.artifact) {
    if (!draft.artifact) return ru ? "Загрузите файл сборки Android перед сохранением прогона." : "Upload the Android build file before saving the run.";
    if (draft.artifact.projectId !== projectId || draft.artifact.kind !== "file" || draft.artifact.owner.kind !== "project"
      || draft.artifact.owner.projectId !== projectId || draft.artifact.status !== "ready") {
      return ru ? "Выберите готовую сборку Android из этого проекта." : "Choose a ready Android build from this project.";
    }
  }
  return "";
}

export function buildSelection(draft: BuildDraft, projectId: string, ru: boolean): PlatformBuildRequest[] {
  const error = platformBuildError(draft, projectId, ru); if (error) throw new Error(error);
  const builds: PlatformBuildRequest[] = [];
  if (draft.artifact) builds.push({ platform: "android", attachmentId: draft.artifact.id,
    ...(draft.androidVersion.trim() ? { version: draft.androidVersion.trim() } : {}) });
  if (draft.iosReference.trim()) builds.push({ platform: "ios", reference: draft.iosReference.trim() });
  return builds;
}
