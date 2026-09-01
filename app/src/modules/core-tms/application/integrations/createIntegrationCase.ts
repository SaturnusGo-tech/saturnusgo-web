import type { Project, TestCaseRevision } from "../../../../core/tms/contracts/legacy-contract";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { createUid } from "../../helpers/id/createUid";
import type { TmsLocale } from "../../localization/model/locale";
import { createTestCase, getTestCase } from "../../test-cases/data/test-case-api";

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
}) {
  if (input.offline) throw new Error("Integration creation requires the TMS API.");
  const source = input.source.trim();
  const target = input.target.trim();
  const endpoint = input.endpoint.trim();
  const russian = input.locale === "ru";
  const revision: TestCaseRevision = {
    revision: 1,
    title: input.name.trim(),
    description: input.description.trim() || (russian
      ? `Проверить контракт ${input.contract} от ${source} к ${target}.`
      : `Verify the ${input.contract} contract from ${source} to ${target}.`),
    preconditions: russian
      ? `${source} и ${target} доступны в выбранном окружении.`
      : `${source} and ${target} are available in the selected environment.`,
    type: "manual",
    lifecycle: "ready",
    priority: "high",
    component: "Integrations",
    ownerIdentityId: null,
    tags: ["integration", `source:${source}`, `target:${target}`],
    estimatedMinutes: 10,
    testData: endpoint
      ? `${russian ? "Эндпоинт или маршрут" : "Endpoint or route"}: ${endpoint}`
      : "",
    steps: [
      {
        id: createUid("step"), order: 1,
        action: russian ? `Подготовить валидный запрос в ${source}` : `Prepare a valid request in ${source}`,
        expectedResult: russian ? "Payload соответствует контракту" : "The payload satisfies the contract",
        required: true,
      },
      {
        id: createUid("step"), order: 2,
        action: russian ? `Отправить взаимодействие в ${target}` : `Send the interaction to ${target}`,
        expectedResult: russian ? "Целевая система обрабатывает запрос" : "The target processes the request",
        required: true,
      },
    ],
    checklist: [],
    attachmentIds: [],
    changeNote: russian ? "Интеграционный тест создан" : "Integration test created",
    createdAt: new Date().toISOString(),
  };
  const created = await createTestCase(input.http, {
    projectId: input.project.id,
    folderPath: "/Integrations",
    revision,
  }, crypto.randomUUID());
  const resource = await getTestCase(input.http, created.data.id);
  return { testCase: resource.data, etag: resource.etag };
}
