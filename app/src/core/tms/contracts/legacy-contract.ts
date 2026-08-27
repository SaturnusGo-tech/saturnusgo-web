// Temporary handwritten mirror of the prototype /api/v1 wire format.
// Delete this module when the generated OpenAPI client becomes authoritative.
export type ExecutionStatus =
  | "not_run"
  | "in_progress"
  | "passed"
  | "failed"
  | "blocked"
  | "skipped";

export type Project = {
  id: string;
  key: string;
  name: string;
  description: string;
  status?: "active" | "archived";
};

export type Environment = {
  id: string;
  projectId: string;
  key: string;
  name: string;
  baseUrl: string;
  description: string;
  isDefault: boolean;
  status?: "active" | "archived";
};

export type TestStep = {
  id: string;
  order: number;
  action: string;
  expectedResult: string;
  testData?: string;
  required: boolean;
};

export type TestCaseRevision = {
  revision: number;
  title: string;
  description: string;
  preconditions: string;
  type: "manual" | "checklist";
  lifecycle: "draft" | "ready" | "deprecated" | "archived";
  priority: "low" | "medium" | "high" | "critical";
  component: string;
  owner: string;
  tags: string[];
  estimatedMinutes: number | null;
  testData: string;
  steps: TestStep[];
  checklist: Array<{ id: string; order: number; text: string; required: boolean }>;
  attachmentIds: string[];
  linkIds: string[];
  changeNote: string;
  createdAt: string;
};

export type TestCase = {
  id: string;
  projectId: string;
  key: string;
  folderPath: string;
  currentRevision: number;
  revisions: TestCaseRevision[];
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Suite = {
  id: string;
  projectId: string;
  key: string;
  name: string;
  description: string;
  type: "static" | "dynamic";
  caseIds: string[];
  filter: { tags?: string[] };
  status: "active" | "archived";
};

export type StepResult = {
  stepId: string;
  status: ExecutionStatus;
  actualResult: string;
  comment: string;
  updatedAt: string;
};

export type RunItem = {
  id: string;
  caseId: string;
  caseKey: string;
  revision: number;
  snapshot: TestCaseRevision;
  assignee: string;
  status: ExecutionStatus;
  attempts: Array<{
    id: string;
    number: number;
    status: ExecutionStatus;
    actualResult: string;
    comment: string;
    stepResults: StepResult[];
  }>;
  activeAttemptId: string;
};

export type TestRun = {
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
  items: RunItem[];
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
};

export type Defect = {
  id: string;
  projectId: string;
  key: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  priority: "low" | "medium" | "high" | "critical";
  status:
    | "open"
    | "triaged"
    | "in_progress"
    | "ready_for_retest"
    | "verified"
    | "closed"
    | "reopened";
  reproducibility: string;
  assignee: string;
  component: string;
  labels: string[];
  runId: string | null;
  runItemId: string | null;
  stepId: string | null;
  expectedResult: string;
  actualResult: string;
  createdAt: string;
};

export type Dashboard = {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  widgets: Array<{ id: string; type: string; title: string }>;
};

export type Activity = {
  id: string;
  actor: string;
  action: string;
  entityKey: string | null;
  createdAt: string;
};

export type Bootstrap = {
  workspace: { id: string; key: string; slug: string; name: string };
  projects: Project[];
  environments: Environment[];
  testCases: TestCase[];
  suites: Suite[];
  runs: TestRun[];
  defects: Defect[];
  dashboards: Dashboard[];
  activity: Activity[];
  meta: { generatedAt: string; apiVersion: string };
};
