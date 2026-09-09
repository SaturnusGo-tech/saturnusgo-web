import type { TestCaseExchangeDocument } from "./test-case-exchange";

export type ImportFolderPreview = Readonly<{
  path: string; name: string; parentPath: string; exists: boolean; caseIndices: readonly number[];
}>;
export type ImportPlan = Readonly<{
  document: TestCaseExchangeDocument;
  folders: readonly ImportFolderPreview[];
  rootCaseIndices: readonly number[];
  newFolderCount: number;
  existingFolderCount: number;
}>;
