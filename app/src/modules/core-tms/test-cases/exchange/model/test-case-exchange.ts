export const LEGACY_TEST_CASE_EXCHANGE_SCHEMA = "saturnusgo.tms.test-cases.v1";
export const TEST_CASE_EXCHANGE_SCHEMA = "saturnusgo.tms.test-cases.v2";
export const TEST_CASE_IMPORT_LIMIT = 2_000;
export const TEST_CASE_IMPORT_BYTES = 5_000_000;

export type TestCaseExchangeSchema =
  | typeof LEGACY_TEST_CASE_EXCHANGE_SCHEMA
  | typeof TEST_CASE_EXCHANGE_SCHEMA;

export type PortableTestStep = Readonly<{
  order: number;
  action: string;
  expectedResult: string;
  testData: string;
  required: boolean;
}>;

export type PortableChecklistItem = Readonly<{
  order: number;
  text: string;
  required: boolean;
}>;

export type PortableTestCase = Readonly<{
  sourceKey?: string;
  folderPath: string;
  title: string;
  description: string;
  preconditions: string;
  type: "manual" | "checklist" | "automated";
  lifecycle: "draft" | "ready" | "deprecated";
  priority: "low" | "medium" | "high" | "critical";
  component: string;
  tags: readonly string[];
  estimatedMinutes: number | null;
  testData: string;
  steps: readonly PortableTestStep[];
  checklist: readonly PortableChecklistItem[];
}>;

export type TestCaseExchangeDocument = Readonly<{
  schemaVersion: TestCaseExchangeSchema;
  exportedAt: string;
  project: Readonly<{ key: string; name: string }>;
  metadata?: Readonly<Record<string, unknown>>;
  testCases: readonly PortableTestCase[];
}>;

export type TestCaseImportProgress = Readonly<{
  completed: number;
  total: number;
}>;

export type TestCaseImportResult = Readonly<{
  completed: number;
  failed: readonly Readonly<{ sourceKey: string; message: string }>[];
}>;
