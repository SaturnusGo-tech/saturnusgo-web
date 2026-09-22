import { buildWorkspaceDeepLink } from "../../../../state/navigation/workspace-deep-link";
import type { ImportFile } from "../model/import-file";

export function importFileLink(href: string, file: Pick<ImportFile, "id" | "workspaceId" | "projectId">): string {
  const url = new URL(buildWorkspaceDeepLink(href, { ...file, view: "imports", runId: null }));
  url.searchParams.set("importFile", file.id);
  return url.href;
}
