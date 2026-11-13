import type { Defect } from "../../../../../core/tms/contracts/legacy-contract";

type CurrentCase = { id: string; projectId: string; folderId?: string | null; folderPath: string };
type CurrentFolder = { id: string; projectId: string; path: string; archivedAt: string | null };
export type DefectSourceDestination = { projectId: string; folderId: string | null; folderPath: string };

export async function resolveDefectSource(defect: Defect, readCase: (id: string) => Promise<CurrentCase>,
  readFolder: (id: string) => Promise<CurrentFolder | null>): Promise<DefectSourceDestination> {
  const location = defect.sourceLocation;
  if (!location) throw new Error("Source location is unavailable.");
  const caseId = defect.sourceCaseId ?? defect.reproduction?.caseId;
  if (caseId) {
    const current = await readCase(caseId);
    if (current.id !== caseId || current.projectId !== defect.projectId) throw new Error("Source scope does not match.");
    return { projectId: defect.projectId, folderId: current.folderId ?? null, folderPath: current.folderPath };
  }
  if (location.folderId) {
    const current = await readFolder(location.folderId);
    if (!current || current.id !== location.folderId || current.projectId !== defect.projectId || current.archivedAt) {
      throw new Error("Source folder is unavailable.");
    }
    return { projectId: defect.projectId, folderId: current.id, folderPath: current.path };
  }
  if (location.folderPath !== "/") throw new Error("Source folder identity is unavailable.");
  return { projectId: defect.projectId, folderId: null, folderPath: "/" };
}
