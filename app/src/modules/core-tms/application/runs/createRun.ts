import type {
  Bootstrap,
  Environment,
  Project,
  Suite,
  TestRun,
} from "../../../../core/tms/contracts/legacy-contract";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { createLocalRun } from "../../helpers/runs/createLocalRun";
import type { TmsLocale } from "../../localization/model/locale";

type Result =
  | { ok: true; run: TestRun }
  | { ok: false; reason: "create" | "start" };

export async function createRun(input: {
  http: TmsHttpClient;
  data: Bootstrap;
  project: Project;
  environment: Environment;
  suite?: Suite;
  caseIds: string[];
  name: string;
  type: TestRun["type"];
  build: string;
  offline: boolean;
  locale: TmsLocale;
}): Promise<Result> {
  const local = createLocalRun(
    input.data,
    input.project.id,
    input.environment,
    input.suite,
    input.caseIds,
    input.name,
    input.type,
    input.locale,
  );
  local.build = input.build;
  if (input.offline) return { ok: true, run: local };
  try {
    const remote = await input.http.mutate<TestRun>("/runs", "POST", {
      projectId: input.project.id,
      suiteId: input.suite?.id ?? null,
      caseIds: input.caseIds,
      environmentId: input.environment.id,
      name: input.name,
      description: local.description,
      type: input.type,
      build: input.build,
      configuration: local.configuration,
    });
    try {
      return {
        ok: true,
        run: await input.http.mutate<TestRun>(`/runs/${remote.id}/start`, "POST"),
      };
    } catch {
      return { ok: false, reason: "start" };
    }
  } catch {
    return { ok: false, reason: "create" };
  }
}
