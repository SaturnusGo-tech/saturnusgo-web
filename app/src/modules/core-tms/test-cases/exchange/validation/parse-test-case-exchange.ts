import {
  LEGACY_TEST_CASE_EXCHANGE_SCHEMA,
  TEST_CASE_EXCHANGE_SCHEMA,
  TEST_CASE_IMPORT_LIMIT,
  type PortableChecklistItem,
  type PortableTestCase,
  type PortableTestStep,
  type TestCaseExchangeSchema,
  type TestCaseExchangeDocument,
} from "../model/test-case-exchange";

type JsonObject = Record<string, unknown>;
const TAG = /^[a-z0-9][a-z0-9._-]{0,63}$/;
const FOLDER = /^\/(?:[^/]+(?:\/[^/]+)*)?$/;

function object(value: unknown, path: string): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${path} must be an object.`);
  }
  return value as JsonObject;
}

function text(value: unknown, path: string, maximum: number, required = false): string {
  if (value === undefined && !required) return "";
  if (typeof value !== "string") throw new Error(`${path} must be a string.`);
  const normalized = value.trim();
  if ((required && !normalized) || normalized.length > maximum) {
    throw new Error(`${path} has an invalid length.`);
  }
  return normalized;
}

function choice<T extends string>(value: unknown, path: string, values: readonly T[]): T {
  if (typeof value !== "string" || !values.includes(value as T)) {
    throw new Error(`${path} has an unsupported value.`);
  }
  return value as T;
}

function integer(value: unknown, path: string, minimum: number, maximum: number): number {
  if (!Number.isInteger(value) || Number(value) < minimum || Number(value) > maximum) {
    throw new Error(`${path} must be an integer from ${minimum} to ${maximum}.`);
  }
  return Number(value);
}

function boolean(value: unknown, path: string): boolean {
  if (value === undefined) return true;
  if (typeof value !== "boolean") throw new Error(`${path} must be a boolean.`);
  return value;
}

function step(value: unknown, index: number): PortableTestStep {
  const item = object(value, `testCases[].steps[${index}]`);
  return {
    order: integer(item.order ?? index + 1, `steps[${index}].order`, 1, 10_000),
    action: text(item.action, `steps[${index}].action`, 20_000, true),
    expectedResult: text(item.expectedResult, `steps[${index}].expectedResult`, 20_000, true),
    testData: text(item.testData, `steps[${index}].testData`, 20_000),
    required: boolean(item.required, `steps[${index}].required`),
  };
}

function checklistItem(value: unknown, index: number): PortableChecklistItem {
  const item = object(value, `testCases[].checklist[${index}]`);
  return {
    order: integer(item.order ?? index + 1, `checklist[${index}].order`, 1, 10_000),
    text: text(item.text, `checklist[${index}].text`, 20_000, true),
    required: boolean(item.required, `checklist[${index}].required`),
  };
}

function testCase(
  value: unknown,
  index: number,
  schemaVersion: TestCaseExchangeSchema,
): PortableTestCase {
  const item = object(value, `testCases[${index}]`);
  const types = schemaVersion === LEGACY_TEST_CASE_EXCHANGE_SCHEMA
    ? ["manual", "checklist"] as const
    : ["manual", "checklist", "automated"] as const;
  const type = choice(item.type ?? "manual", `testCases[${index}].type`, types);
  const folderPath = text(item.folderPath ?? "/", `testCases[${index}].folderPath`, 500, true);
  if (!FOLDER.test(folderPath)) throw new Error(`testCases[${index}].folderPath is invalid.`);
  const tags = Array.isArray(item.tags)
    ? item.tags.map((tag, tagIndex) => text(tag, `testCases[${index}].tags[${tagIndex}]`, 64, true))
    : [];
  if (tags.length > 100 || new Set(tags).size !== tags.length || tags.some((tag) => !TAG.test(tag))) {
    throw new Error(`testCases[${index}].tags are invalid.`);
  }
  const steps = Array.isArray(item.steps) ? item.steps.map(step) : [];
  const checklist = Array.isArray(item.checklist) ? item.checklist.map(checklistItem) : [];
  const incompatibleProcedure = type === "checklist" ? steps.length : checklist.length;
  if (steps.length > 500 || checklist.length > 500 || incompatibleProcedure
    || (type === "automated" && steps.length === 0)) {
    throw new Error(`testCases[${index}] has an invalid procedure.`);
  }
  const estimate = item.estimatedMinutes;
  return {
    sourceKey: item.sourceKey === undefined ? undefined : text(item.sourceKey, `testCases[${index}].sourceKey`, 128, true),
    folderPath,
    title: text(item.title, `testCases[${index}].title`, 300, true),
    description: text(item.description, `testCases[${index}].description`, 20_000),
    preconditions: text(item.preconditions, `testCases[${index}].preconditions`, 20_000),
    type,
    lifecycle: choice(item.lifecycle ?? "draft", `testCases[${index}].lifecycle`, ["draft", "ready", "deprecated"]),
    priority: choice(item.priority ?? "medium", `testCases[${index}].priority`, ["low", "medium", "high", "critical"]),
    component: text(item.component, `testCases[${index}].component`, 500),
    tags,
    estimatedMinutes: estimate === null || estimate === undefined ? null : integer(estimate, `testCases[${index}].estimatedMinutes`, 0, 100_000),
    testData: text(item.testData, `testCases[${index}].testData`, 20_000),
    steps,
    checklist,
  };
}

export function parseTestCaseExchange(source: string): TestCaseExchangeDocument {
  let parsed: unknown;
  try { parsed = JSON.parse(source.replace(/^\uFEFF/, "")); } catch { throw new Error("The selected file is not valid JSON."); }
  const document = object(parsed, "document");
  const schemaVersion = choice(document.schemaVersion, "schemaVersion", [
    LEGACY_TEST_CASE_EXCHANGE_SCHEMA,
    TEST_CASE_EXCHANGE_SCHEMA,
  ]);
  const project = object(document.project, "project");
  if (!Array.isArray(document.testCases) || document.testCases.length > TEST_CASE_IMPORT_LIMIT) {
    throw new Error(`testCases must contain at most ${TEST_CASE_IMPORT_LIMIT} items.`);
  }
  const testCases = document.testCases.map((value, index) => (
    testCase(value, index, schemaVersion)
  ));
  const keys = testCases.flatMap((item) => item.sourceKey ? [item.sourceKey] : []);
  if (new Set(keys).size !== keys.length) throw new Error("sourceKey values must be unique.");
  return {
    schemaVersion,
    exportedAt: text(document.exportedAt, "exportedAt", 64, true),
    project: { key: text(project.key, "project.key", 128, true), name: text(project.name, "project.name", 200, true) },
    metadata: document.metadata === undefined ? undefined : object(document.metadata, "metadata"),
    testCases,
  };
}
