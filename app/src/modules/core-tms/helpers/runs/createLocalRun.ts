import type {
  Bootstrap,
  Environment,
  Suite,
  TestRun,
} from "../../../../core/tms/contracts/legacy-contract";
import type { TmsLocale } from "../../localization/model/locale";
import { createUid } from "../id/createUid";
import { executableSteps, latestRevision } from "../cases/caseRevision";

const runDescription = (type: TestRun["type"], locale: TmsLocale) => {
  if (locale !== "ru") return `${type.replace("_", " ")} execution`;
  return {
    smoke: "Смоук-прогон",
    regression: "Регрессионный прогон",
    acceptance: "Приёмочный прогон",
    ad_hoc: "Разовый прогон",
  }[type];
};

export function createLocalRun(
  data: Bootstrap,
  projectId: string,
  environment: Environment,
  suite: Suite | undefined,
  caseIds: string[],
  name: string,
  type: TestRun["type"],
  locale: TmsLocale = "en",
): TestRun {
  const cases = data.testCases.filter(
    (item) =>
      item.projectId === projectId &&
      !item.archivedAt &&
      caseIds.includes(item.id),
  );
  const createdAt = new Date().toISOString();
  return {
    id: createUid("run"),
    projectId,
    key: `${data.projects.find((project) => project.id === projectId)?.key ?? "TMS"}-TR-${String(data.runs.length + 1).padStart(3, "0")}`,
    name,
    description: runDescription(type, locale),
    type,
    status: "active",
    environment: {
      id: environment.id,
      key: environment.key,
      name: environment.name,
      baseUrl: environment.baseUrl,
    },
    suiteId: suite?.id ?? null,
    build: "local-current",
    configuration: { browser: "Chrome", platform: "macOS" },
    items: cases.map((item) => {
      const snapshot = structuredClone(latestRevision(item));
      const attemptId = createUid("attempt");
      return {
        id: createUid("run-item"),
        caseId: item.id,
        caseKey: item.key,
        revision: item.currentRevision,
        snapshot,
        assignee: "QA Team",
        status: "not_run",
        activeAttemptId: attemptId,
        attempts: [
          {
            id: attemptId,
            number: 1,
            status: "not_run",
            actualResult: "",
            comment: "",
            stepResults: executableSteps(snapshot, locale).map((step) => ({
              stepId: step.id,
              status: "not_run",
              actualResult: "",
              comment: "",
              updatedAt: createdAt,
            })),
          },
        ],
      };
    }),
    createdAt,
    startedAt: createdAt,
    completedAt: null,
  };
}
