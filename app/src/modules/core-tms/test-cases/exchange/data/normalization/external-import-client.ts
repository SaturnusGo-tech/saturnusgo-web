import type { components } from "../../../../../../core/tms/generated/tms-api";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import type { ExternalImportPort, ExternalImportRecord } from "../../model/external/external-import";
import { TEST_CASE_EXCHANGE_SCHEMA } from "../../model/test-case-exchange";
import { parseTestCaseExchange } from "../../validation/parse-test-case-exchange";
type Schemas = components["schemas"];
function sourceKey(records: readonly ExternalImportRecord[], path: string): unknown {
  const value = records.find(record => record.path === path)?.value;
  if (!value || typeof value !== "object" || Array.isArray(value) || !Object.prototype.hasOwnProperty.call(value, "sourceKey")) return undefined;
  const key = (value as { sourceKey: unknown }).sourceKey;
  return typeof key === "number" && Number.isSafeInteger(key) ? String(key) : key;
}
export function externalImportClient(http: TmsHttpClient, project: { id: string; key: string; name: string }, locale: "ru" | "en"): ExternalImportPort {
  return {
    inspect: async (source, signal) => {
      const body: Schemas["ImportInspectRequest"] = { projectId: project.id, source };
      const result = await http.mutate<Schemas["ImportInspectResponse"]["data"]>("/test-case-import/inspect", "POST", body, signal);
      return result.records.map(r => ({ path: r.path, value: r.value, context: r.context }));
    },
    normalize: async (records, folders, signal) => {
      const body: Schemas["ImportNormalizeRequest"] = { projectId: project.id, locale, records, folders };
      const result = await http.mutate<Schemas["ImportNormalizeResponse"]["data"]>("/test-case-import/normalize", "POST", body, signal);
      const converted = parseTestCaseExchange(JSON.stringify({ schemaVersion: TEST_CASE_EXCHANGE_SCHEMA, exportedAt: new Date().toISOString(), project,
        testCases: result.cases.map(c => ({ ...c.content, folderPath: c.folderPath, sourceKey: sourceKey(records, c.sourcePath) })) }));
      return { cases: result.cases.map((c, i) => ({ sourcePath: c.sourcePath, value: converted.testCases[i]!, warnings: c.warnings })), issues: result.issues };
    },
  };
}
