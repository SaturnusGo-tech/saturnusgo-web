export type ExecutionStatus = "not_run" | "in_progress" | "passed" | "failed" | "blocked" | "skipped";

export type TestStep = {
  id: string;
  order: number;
  action: string;
  expectedResult: string;
  testData?: string;
  required: boolean;
  attachmentIds?: string[];
};

export type TestCaseRevision = {
  revision: number;
  title: string;
  description: string;
  preconditions: string;
  type: "manual" | "checklist";
  lifecycle: "draft" | "ready" | "deprecated";
  priority: "low" | "medium" | "high" | "critical";
  component: string;
  ownerIdentityId: string | null;
  tags: string[];
  estimatedMinutes: number | null;
  testData: string;
  steps: TestStep[];
  checklist: Array<{ id: string; order: number; text: string; required: boolean }>;
  attachmentIds: string[];
  changeNote: string;
  createdBy?: string;
  createdAt: string;
};

export type StepResult = {
  stepId: string;
  status: ExecutionStatus;
  actualResult: string;
  comment: string;
  attachmentIds: string[];
  updatedAt: string;
};

export type RunAttemptSummary = {
  attemptNo: number;
  status: ExecutionStatus;
  actualResult: string;
  comment: string;
  blockedReason: string;
  attachmentIds: string[];
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RunAttempt = RunAttemptSummary & { stepResults: StepResult[] };

export type RunItemSummary = {
  id: string;
  caseId: string;
  caseKey: string;
  revision: number;
  assigneeIdentityId: string | null;
  status: ExecutionStatus;
  attemptCount: number;
  activeAttemptNo: number;
  createdAt: string;
  updatedAt: string;
};

export type RunItem = RunItemSummary & {
  snapshot: TestCaseRevision;
  attempts: RunAttempt[];
};

export type RunProgress = {
  total: number;
  executed: number;
  percent: number;
  counts: Record<ExecutionStatus, number>;
};

export type TestRunSummary = {
  id: string;
  projectId: string;
  key: string;
  name: string;
  description: string;
  type: "smoke" | "regression" | "acceptance" | "ad_hoc";
  status: "draft" | "active" | "completed" | "aborted";
  environment: { id: string; key: string; name: string; baseUrl: string };
  suiteId: string | null;
  build: string;
  configuration: Record<string, string>;
  itemCount: number;
  progress: RunProgress;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
};

export type TestRun = TestRunSummary & { items: RunItem[] };
