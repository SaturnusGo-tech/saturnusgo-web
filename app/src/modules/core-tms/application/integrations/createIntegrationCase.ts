import type {
  Project,
  TestCase,
} from "../../../../core/tms/contracts/legacy-contract";
import { mutate } from "../../../../core/tms/transport/http";
import { createUid } from "../../helpers/id/createUid";

export async function createIntegrationCase(input: {
  project: Project;
  casesCount: number;
  name: string;
  source: string;
  target: string;
  contract: string;
  endpoint: string;
  description: string;
  offline: boolean;
}): Promise<TestCase> {
  const createdAt = new Date().toISOString();
  const source = input.source.trim();
  const target = input.target.trim();
  const endpoint = input.endpoint.trim();
  const payload = {
    projectId: input.project.id,
    folderPath: "/Integrations",
    title: input.name.trim(),
    description:
      input.description.trim() ||
      `Verify the ${input.contract} contract from ${input.source} to ${input.target}.`,
    preconditions: `${input.source} and ${input.target} are available in the selected environment. Required credentials and test data are prepared.`,
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
      ? `Endpoint or route: ${endpoint}`
      : "Use a dedicated integration test payload.",
    steps: [
      {
        id: createUid("step"),
        order: 1,
        action: `Prepare a valid request or event in ${input.source}`,
        expectedResult: "The source payload satisfies the agreed contract",
        required: true,
      },
      {
        id: createUid("step"),
        order: 2,
        action: `Send the ${input.contract} interaction to ${input.target}${endpoint ? ` via ${endpoint}` : ""}`,
        expectedResult: "The target accepts and processes the interaction",
        required: true,
      },
      {
        id: createUid("step"),
        order: 3,
        action: `Verify the resulting state in ${input.target}`,
        expectedResult: "Data is mapped without loss or corruption",
        required: true,
      },
      {
        id: createUid("step"),
        order: 4,
        action: "Repeat with an invalid or incomplete payload",
        expectedResult:
          "The integration returns a controlled error and preserves system state",
        required: true,
      },
    ],
    checklist: [],
    attachmentIds: [],
    linkIds: endpoint ? [endpoint] : [],
    changeNote: "Integration test created",
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
    return await mutate<TestCase>("/test-cases", "POST", payload);
  } catch (error) { throw error; }
}
