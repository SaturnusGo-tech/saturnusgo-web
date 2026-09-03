export type SharedStepItem = Readonly<{
  id: string;
  order: number;
  action: string;
  expectedResult: string;
  testData: string;
  required: boolean;
  attachmentIds: readonly string[];
}>;

export type SharedStepRevision = Readonly<{
  revision: number;
  title: string;
  items: readonly SharedStepItem[];
  changeNote: string;
  createdBy: string;
  createdAt: string;
}>;

export type SharedStep = Readonly<{
  id: string;
  projectId: string;
  currentRevision: number;
  current: SharedStepRevision;
  revisionCount: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  etag: string;
}>;

export type SharedStepSummary = Readonly<{
  id: string;
  projectId: string;
  currentRevision: number;
  title: string;
  itemCount: number;
  usageCount: number;
  revisionCount: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  etag: string;
}>;

export type SharedStepDraft = Readonly<{
  title: string;
  items: readonly SharedStepItem[];
  changeNote: string;
}>;

export const emptySharedStepDraft = (): SharedStepDraft => ({
  title: "",
  items: [{ id: `shared-item-${crypto.randomUUID()}`, order: 1, action: "",
    expectedResult: "", testData: "", required: true, attachmentIds: [] }],
  changeNote: "",
});
