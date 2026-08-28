import type {
  Project,
  TestCase,
} from "../../../../core/tms/contracts/legacy-contract";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { createUid } from "../../helpers/id/createUid";
import type { TmsLocale } from "../../localization/model/locale";

export async function createIntegrationCase(input: {
  http: TmsHttpClient;
  project: Project;
  casesCount: number;
  name: string;
  source: string;
  target: string;
  contract: string;
  endpoint: string;
  description: string;
  offline: boolean;
  locale: TmsLocale;
}): Promise<TestCase> {
  const createdAt = new Date().toISOString();
  const source = input.source.trim();
  const target = input.target.trim();
  const endpoint = input.endpoint.trim();
  const russian = input.locale === "ru";
  const payload = {
    projectId: input.project.id,
    folderPath: "/Integrations",
    title: input.name.trim(),
    description:
      input.description.trim() ||
      (russian
        ? `Проверить контракт ${input.contract} от ${source} к ${target}.`
        : `Verify the ${input.contract} contract from ${source} to ${target}.`),
    preconditions: russian
      ? `${source} и ${target} доступны в выбранном окружении. Необходимые учётные данные и тестовые данные подготовлены.`
      : `${source} and ${target} are available in the selected environment. Required credentials and test data are prepared.`,
    type: "manual" as const,
    lifecycle: "ready" as const,
    priority: "high" as const,
    component: "Integrations",
    owner: "QA Team",
    tags: [
      "integration",
      `source:${source}`,
      `target:${target}`,
      `contract:${input.contract}`,
    ],
    estimatedMinutes: 10,
    testData: endpoint
      ? `${russian ? "Эндпоинт или маршрут" : "Endpoint or route"}: ${endpoint}`
      : russian
        ? "Использовать отдельный payload для интеграционного теста."
        : "Use a dedicated integration test payload.",
    steps: [
      {
        id: createUid("step"),
        order: 1,
        action: russian
          ? `Подготовить валидный запрос или событие в ${source}`
          : `Prepare a valid request or event in ${source}`,
        expectedResult: russian
          ? "Payload источника соответствует согласованному контракту"
          : "The source payload satisfies the agreed contract",
        required: true,
      },
      {
        id: createUid("step"),
        order: 2,
        action: russian
          ? `Отправить взаимодействие ${input.contract} в ${target}${endpoint ? ` через ${endpoint}` : ""}`
          : `Send the ${input.contract} interaction to ${target}${endpoint ? ` via ${endpoint}` : ""}`,
        expectedResult: russian
          ? "Целевая система принимает и обрабатывает взаимодействие"
          : "The target accepts and processes the interaction",
        required: true,
      },
      {
        id: createUid("step"),
        order: 3,
        action: russian
          ? `Проверить итоговое состояние в ${target}`
          : `Verify the resulting state in ${target}`,
        expectedResult: russian
          ? "Данные сопоставлены без потерь и искажений"
          : "Data is mapped without loss or corruption",
        required: true,
      },
      {
        id: createUid("step"),
        order: 4,
        action: russian
          ? "Повторить проверку с невалидным или неполным payload"
          : "Repeat with an invalid or incomplete payload",
        expectedResult:
          russian
            ? "Интеграция возвращает контролируемую ошибку и сохраняет состояние системы"
            : "The integration returns a controlled error and preserves system state",
        required: true,
      },
    ],
    checklist: [],
    attachmentIds: [],
    linkIds: endpoint ? [endpoint] : [],
    changeNote: russian
      ? "Интеграционный тест создан"
      : "Integration test created",
    createdAt,
  };
  if (input.offline) {
    return {
      id: createUid("case"),
      projectId: input.project.id,
      key: `${input.project.key}-TC-${String(input.casesCount + 1).padStart(3, "0")}`,
      folderPath: "/Integrations",
      currentRevision: 1,
      revisions: [{ revision: 1, ...payload }],
      archivedAt: null,
      createdAt,
      updatedAt: createdAt,
    };
  }
  try {
    return await input.http.mutate<TestCase>("/test-cases", "POST", payload);
  } catch (error) { throw error; }
}
