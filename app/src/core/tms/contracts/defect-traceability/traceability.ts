export type DefectSourceLocation = {
  readonly folderId: string | null;
  readonly folderPath: string;
  readonly capturedAt: string;
  readonly origin: "run" | "case" | "manual";
};

export type DefectReproductionStep = {
  readonly id: string;
  readonly order: number;
  readonly action: string;
  readonly expectedResult: string;
  readonly testData: string;
  readonly required: boolean;
  readonly sharedStep: { readonly id: string; readonly title: string; readonly revision: number | null } | null;
  readonly failed: boolean;
};

export type DefectReproduction = {
  readonly origin: "run" | "shared_steps";
  readonly caseId: string | null;
  readonly caseRevision: number | null;
  readonly steps: readonly DefectReproductionStep[];
};
