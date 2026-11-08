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

export async function importProjectCases(
  http: TmsHttpClient,
  projectId: string,
  document: TestCaseExchangeDocument,
  progress?: (value: TestCaseImportProgress) => void,
  options: Readonly<{ signal?: AbortSignal; successfulIndices?: readonly number[] }> = {},
): Promise<TestCaseImportResult> {
  const successful = new Set(options.successfulIndices ?? []);
  const failed: { sourceKey: string; index: number; message: string }[] = [];
  let attempted = successful.size;
  const occurrences = new Map<string, number>();
  for (const [index, item] of document.testCases.entries()) {
    const request = body(projectId, item);
    const canonical = JSON.stringify(request);
    const occurrence = occurrences.get(canonical) ?? 0;
    occurrences.set(canonical, occurrence + 1);
    if (successful.has(index)) continue;
    if (options.signal?.aborted) break;
    try {
      const key = `case_import_${await digest(occurrence ? JSON.stringify({ request, occurrence }) : canonical)}`;
      options.signal?.throwIfAborted();
      await http.mutateResource<Api["TestCase"]>("/test-cases", "POST", request,
        { idempotencyKey: key, signal: options.signal });
      successful.add(index);
    } catch (error) {
      if (options.signal?.aborted) break;
      failed.push({ index, sourceKey: item.sourceKey ?? `item-${index + 1}`,
        message: error instanceof Error ? error.message : "Import failed." });
    }
    attempted += 1;
    progress?.({ completed: successful.size, attempted, total: document.testCases.length });
  }
  return { completed: successful.size, attempted, successfulIndices: [...successful],
    cancelled: options.signal?.aborted ?? false, failed };
}
