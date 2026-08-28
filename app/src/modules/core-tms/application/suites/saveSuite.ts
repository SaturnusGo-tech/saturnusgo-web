import type { components } from "../../../../core/tms/generated/tms-api";
import type { Suite } from "../../../../core/tms/contracts/legacy-contract";
import type { TmsHttpClient, TmsResource } from "../../../../core/tms/transport/http";
import { createUid } from "../../helpers/id/createUid";
import { createSuite, updateSuite } from "../../suites/data/suite-api";

type Api = components["schemas"];

export async function saveSuite(input: {
  http: TmsHttpClient;
  suite?: Suite;
  suiteEtag?: string | null;
  projectId: string;
  name: string;
  description: string;
  type: Suite["type"];
  caseIds: string[];
  tags: string[];
  offline: boolean;
}): Promise<TmsResource<Suite>> {
  const shared = {
    name: input.name.trim(),
    description: input.description.trim(),
    type: input.type,
    caseIds: input.type === "static" ? Array.from(new Set(input.caseIds)) : [],
    filter: input.type === "dynamic" ? { tags: Array.from(new Set(input.tags)) } : {},
  } satisfies Api["SuitePatchRequest"];
  if (input.offline) {
    const now = new Date().toISOString();
    const suite: Suite = {
      id: input.suite?.id ?? createUid("suite"),
      projectId: input.projectId,
      key: input.suite?.key ?? `TS-${Date.now().toString().slice(-4)}`,
      ...shared,
      caseCount: shared.caseIds.length,
      resolvedCaseCount: shared.caseIds.length,
      status: input.suite?.status ?? "active",
      createdAt: input.suite?.createdAt ?? now,
      updatedAt: now,
    };
    return { data: suite, etag: null };
  }
  const key = crypto.randomUUID();
  if (input.suite) {
    if (!input.suiteEtag) throw new Error("Suite ETag is required for update.");
    return await updateSuite(input.http, input.suite.id, shared, input.suiteEtag, key);
  }
  const body = { projectId: input.projectId, ...shared } satisfies Api["SuiteCreateRequest"];
  return await createSuite(input.http, body, key);
}
