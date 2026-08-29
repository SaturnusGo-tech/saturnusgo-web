import type { components } from "../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import {
  TEST_CASE_EXCHANGE_SCHEMA,
  TEST_CASE_IMPORT_LIMIT,
  type PortableTestCase,
  type TestCaseExchangeDocument,
} from "../model/test-case-exchange";

type Api = components["schemas"];

function portable(testCase: Api["TestCase"]): PortableTestCase {
  const revision = testCase.current;
  return {
    sourceKey: testCase.key,
    folderPath: testCase.folderPath,
    title: revision.title,
    description: revision.description,
    preconditions: revision.preconditions,
    type: revision.type,
    lifecycle: revision.lifecycle,
    priority: revision.priority,
    component: revision.component,
    tags: [...revision.tags],
    estimatedMinutes: revision.estimatedMinutes,
    testData: revision.testData,
    steps: revision.steps.map(({ order, action, expectedResult, testData, required }) => ({
      order, action, expectedResult, testData: testData ?? "", required,
    })),
    checklist: revision.checklist.map(({ order, text, required }) => ({ order, text, required })),
  };
}

async function caseIds(http: TmsHttpClient, projectId: string, signal?: AbortSignal) {
  const ids: string[] = [];
  let cursor: string | null = null;
  do {
    const query = new URLSearchParams({ projectId, includeArchived: "true", limit: "100" });
    if (cursor) query.set("cursor", cursor);
    const page = await http.get<Api["TestCaseListEnvelope"]>(`/test-cases?${query}`, signal);
    ids.push(...page.data.map((item) => item.id));
    cursor = page.meta.nextCursor;
    if (ids.length > TEST_CASE_IMPORT_LIMIT) throw new Error("The project exceeds the exchange limit.");
  } while (cursor);
  return ids;
}

export async function exportProjectCases(
  http: TmsHttpClient,
  project: Readonly<{ id: string; key: string; name: string }>,
  signal?: AbortSignal,
): Promise<TestCaseExchangeDocument> {
  const ids = await caseIds(http, project.id, signal);
  const testCases: PortableTestCase[] = [];
  for (let offset = 0; offset < ids.length; offset += 6) {
    const page = await Promise.all(ids.slice(offset, offset + 6).map(async (id) => {
      const resource = await http.getResource<Api["TestCase"]>(`/test-cases/${id}`, signal);
      return portable(resource.data);
    }));
    testCases.push(...page);
  }
  return {
    schemaVersion: TEST_CASE_EXCHANGE_SCHEMA,
    exportedAt: new Date().toISOString(),
    project: { key: project.key, name: project.name },
    testCases,
  };
}
