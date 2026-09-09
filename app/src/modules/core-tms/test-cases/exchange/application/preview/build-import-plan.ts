import type { RepositoryFolder } from "../../../../folders/model/folder";
import type { ImportPlan } from "../../model/import-plan";
import type { TestCaseExchangeDocument } from "../../model/test-case-exchange";
import { importDestinationPath, validateImportFolderPath } from "../../validation/folder-path";

export function buildImportPlan(document: TestCaseExchangeDocument, destination: string,
  existing: readonly RepositoryFolder[]): ImportPlan {
  validateImportFolderPath(destination);
  const known = new Set(existing.filter((folder) => !folder.archivedAt).map((folder) => folder.path));
  if (destination !== "/" && !known.has(destination)) throw new Error("The destination folder is unavailable.");
  const testCases = document.testCases.map((item) => ({ ...item,
    folderPath: importDestinationPath(destination, item.folderPath) }));
  const requested = [...(document.folders ?? []).map((path) => importDestinationPath(destination, path)),
    ...testCases.map((item) => item.folderPath)];
  const paths = new Set<string>();
  for (const path of requested) {
    const parts = path.split("/").filter(Boolean);
    for (let count = 1; count <= parts.length; count += 1) paths.add(`/${parts.slice(0, count).join("/")}`);
    if (paths.size > 2_000) throw new Error("The import may contain at most 2,000 folders.");
  }
  const folders = [...paths].sort((left, right) => left.localeCompare(right)).map((path) => ({
    path, name: path.slice(path.lastIndexOf("/") + 1), parentPath: path.slice(0, path.lastIndexOf("/")) || "/",
    exists: known.has(path), caseIndices: testCases.flatMap((item, index) => item.folderPath === path ? [index] : []),
  }));
  return { document: { ...document, testCases, folders: [...paths] }, folders,
    rootCaseIndices: testCases.flatMap((item, index) => item.folderPath === "/" ? [index] : []),
    newFolderCount: folders.filter((folder) => !folder.exists).length,
    existingFolderCount: folders.filter((folder) => folder.exists).length };
}
