import type {
  Environment,
  Project,
  SuiteSummary,
  TestRunSummary,
} from "../../../../core/tms/contracts/legacy-contract";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { createRun as createRunResource, getRun } from "../../runs/data/run-api";

type Result =
  | { ok: true; run: TestRunSummary }
  | { ok: false; reason: "create" };

export async function createRun(input: {
  http: TmsHttpClient;
  project: Project;
  environment: Environment;
  suite?: SuiteSummary;
  caseIds: string[];
  name: string;
  type: TestRunSummary["type"];
  build: string;
  offline: boolean;
}): Promise<Result> {
  if (input.offline) return { ok: false, reason: "create" };
  try {
    const scope = input.suite
      ? { suiteId: input.suite.id }
      : { caseIds: input.caseIds };
    const created = await createRunResource(input.http, {
      projectId: input.project.id,
      environmentId: input.environment.id,
      name: input.name,
      description: `${input.type.replace("_", " ")} execution`,
      type: input.type,
      build: input.build,
      configuration: {},
      startImmediately: true,
      ...scope,
    }, crypto.randomUUID());
    return { ok: true, run: (await getRun(input.http, created.data.id)).data };
  } catch {
    return { ok: false, reason: "create" };
  }
}
