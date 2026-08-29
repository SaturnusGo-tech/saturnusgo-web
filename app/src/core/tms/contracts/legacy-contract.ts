import type { TestCaseRevision, TestRunSummary } from "./execution-contract";
export type {
  ExecutionStatus, RunAttempt, RunAttemptSummary, RunItem, RunItemSummary, RunProgress,
  StepResult, TestCaseRevision, TestRun, TestRunSummary, TestStep,
} from "./execution-contract";

export type Project = {
  id: string;
  key: string;
  name: string;
  description?: string;
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

export type TestCaseSummary = {
  id: string;
  projectId: string;
  key: string;
  folderPath: string;
  currentRevision: number;
  title: string;
  type: TestCaseRevision["type"];
  lifecycle: TestCaseRevision["lifecycle"];
  priority: TestCaseRevision["priority"];
  component: string;
  ownerIdentityId: string | null;
  tags: string[];
  estimatedMinutes: number | null;
  revisionCount: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TestCase = TestCaseSummary & {
  current: TestCaseRevision;
  linkIds: string[];
};

export type SuiteSummary = {
  id: string;
  projectId: string;
  key: string;
  name: string;
  description: string;
  type: "static" | "dynamic";
  caseCount: number;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
};

export type Suite = SuiteSummary & {
  caseIds: string[];
  filter: { tags?: string[] };
  resolvedCaseCount: number;
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
  assigneeIdentityId: string | null;
  component: string;
  labels: string[];
  runId: string | null;
  runItemId: string | null;
  stepId: string | null;
  expectedResult: string;
  actualResult: string;
  attachmentIds: string[];
  linkIds: string[];
  createdAt: string;
};

export type ExternalLink = {
  id: string;
  projectId: string;
  owner:
    | { kind: "test_case"; caseId: string }
    | { kind: "run"; runId: string; runItemId: string | null }
    | { kind: "defect"; defectId: string };
  label: string;
  targetUri: string;
  kind: "url" | "deep_link" | "external_issue";
  status: "active" | "archived";
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
  testCases: TestCaseSummary[];
  suites: SuiteSummary[];
  runs: TestRunSummary[];
  defects: Defect[];
  externalLinks: ExternalLink[];
  dashboards: Dashboard[];
  activity: Activity[];
  meta: {
    generatedAt: string;
    apiVersion: string;
    authorization: { role: string; capabilities: string[] };
  };
};
