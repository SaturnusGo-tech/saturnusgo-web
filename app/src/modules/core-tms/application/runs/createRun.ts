import type {
  Bootstrap,
  Environment,
  Project,
  Suite,
  TestRun,
} from "../../../../core/tms/contracts/legacy-contract";
import { mutate } from "../../../../core/tms/transport/http";
import { createLocalRun } from "../../helpers/runs/createLocalRun";

type Result =
  | { ok: true; run: TestRun }
  | { ok: false; reason: "create" | "start" };

export async function createRun(input: {
  data: Bootstrap;
  project: Project;
  environment: Environment;
  suite?: Suite;
  caseIds: string[];
  name: string;
  type: TestRun["type"];
  build: string;
  offline: boolean;
}): Promise<Result> {
  const local = createLocalRun(
    input.data,
    input.project.id,
    input.environment,
    input.suite,
    input.caseIds,
    input.name,
    input.type,
  );
  local.build = input.build;
  if (input.offline) return { ok: true, run: local };
  try {
    const remote = await mutate<TestRun>("/runs", "POST", {
      projectId: input.project.id,
      suiteId: input.suite?.id ?? null,
      caseIds: input.caseIds,
      environmentId: input.environment.id,
      name: input.name,
      type: input.type,
      build: input.build,
      configuration: local.configuration,
    });
    try {
      return {
        ok: true,
        run: await mutate<TestRun>(`/runs/${remote.id}/start`, "POST"),
      };
    } catch {
      return { ok: false, reason: "start" };
    }
  } catch {
    return { ok: false, reason: "create" };
  }
}
