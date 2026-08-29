import type { components } from "../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import type {
  PortableTestCase,
  TestCaseExchangeDocument,
  TestCaseImportProgress,
  TestCaseImportResult,
} from "../model/test-case-exchange";

type Api = components["schemas"];

async function digest(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((item) => item.toString(16).padStart(2, "0")).join("");
}

function sourceTag(sourceKey: string | undefined): string | null {
  if (!sourceKey) return null;
  const value = `source-${sourceKey.toLowerCase().replace(/[^a-z0-9._-]+/g, "-")}`.slice(0, 64);
  return /^[a-z0-9][a-z0-9._-]{0,63}$/.test(value) ? value : null;
}

function body(projectId: string, item: PortableTestCase): Api["TestCaseCreateRequest"] {
  const marker = sourceTag(item.sourceKey);
  return {
    projectId,
    folderPath: item.folderPath,
    title: item.title,
    description: item.description,
    preconditions: item.preconditions,
    type: item.type,
    lifecycle: item.lifecycle,
    priority: item.priority,
    component: item.component,
    ownerIdentityId: null,
    tags: marker && !item.tags.includes(marker) ? [...item.tags, marker] : [...item.tags],
    estimatedMinutes: item.estimatedMinutes,
    testData: item.testData,
    steps: item.steps.map((step) => ({ ...step })),
    checklist: item.checklist.map((entry) => ({ ...entry })),
    changeNote: item.sourceKey ? `Imported from ${item.sourceKey}` : "Imported from TMS exchange",
  };
}

async function importOne(http: TmsHttpClient, projectId: string, item: PortableTestCase) {
  const request = body(projectId, item);
  const key = `case_import_${await digest(JSON.stringify(request))}`;
  await http.mutateResource<Api["TestCase"]>("/test-cases", "POST", request, { idempotencyKey: key });
}

export async function importProjectCases(
  http: TmsHttpClient,
  projectId: string,
  document: TestCaseExchangeDocument,
  progress?: (value: TestCaseImportProgress) => void,
): Promise<TestCaseImportResult> {
  const failed: { sourceKey: string; message: string }[] = [];
  let completed = 0;
  for (const [index, item] of document.testCases.entries()) {
    try {
      await importOne(http, projectId, item);
    } catch (error) {
      failed.push({
        sourceKey: item.sourceKey ?? `item-${index + 1}`,
        message: error instanceof Error ? error.message : "Import failed.",
      });
    } finally {
      completed += 1;
      progress?.({ completed, total: document.testCases.length });
    }
  }
  return { completed, failed };
}
