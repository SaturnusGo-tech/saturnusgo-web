import type { components } from "../../../../core/tms/generated/tms-api";
import type {
  TestCase,
  TestCaseRevision,
  TestCaseSummary,
} from "../../../../core/tms/contracts/legacy-contract";

type ApiCase = components["schemas"]["TestCase"];
type ApiRevision = components["schemas"]["TestCaseRevision"];
type ApiRevisionSummary = components["schemas"]["TestCaseRevisionSummary"];
type ApiSummary = components["schemas"]["TestCaseSummary"];

export type RevisionSummary = {
  revision: number;
  title: string;
  type: TestCaseRevision["type"];
  lifecycle: TestCaseRevision["lifecycle"];
  priority: TestCaseRevision["priority"];
  component: string;
  ownerIdentityId: string | null;
  estimatedMinutes: number | null;
  changeNote: string;
  createdBy: string;
  createdAt: string;
};

export function mapTestCaseRevision(dto: ApiRevision): TestCaseRevision {
  return {
    revision: dto.revision,
    title: dto.title,
    description: dto.description,
    preconditions: dto.preconditions,
    type: dto.type,
    lifecycle: dto.lifecycle,
    priority: dto.priority,
    component: dto.component,
    ownerIdentityId: dto.ownerIdentityId,
    tags: [...dto.tags],
    estimatedMinutes: dto.estimatedMinutes,
    testData: dto.testData,
    steps: dto.steps.map((step) => ({ ...step,
      attachmentIds: [...step.attachmentIds],
      sharedStepId: step.sharedStepId ?? null,
      sharedStep: step.sharedStep ? { ...step.sharedStep,
        items: step.sharedStep.items.map((item, index) => ({ ...item,
          id: item.id ?? `shared-item-${index + 1}`, order: item.order ?? index + 1,
          testData: item.testData ?? "", attachmentIds: [...item.attachmentIds] })) } : null,
    })),
    checklist: dto.checklist.map((item) => ({ ...item })),
    attachmentIds: [...dto.attachmentIds],
    changeNote: dto.changeNote,
    createdBy: dto.createdBy,
    createdAt: dto.createdAt,
  };
}

export function mapTestCaseSummary(dto: ApiSummary): TestCaseSummary {
  return {
    id: dto.id,
    projectId: dto.projectId,
    key: dto.key,
    folderPath: dto.folderPath,
    currentRevision: dto.currentRevision,
    title: dto.title,
    type: dto.type,
    lifecycle: dto.lifecycle,
    priority: dto.priority,
    component: dto.component,
    ownerIdentityId: dto.ownerIdentityId,
    tags: [...dto.tags],
    estimatedMinutes: dto.estimatedMinutes,
    revisionCount: dto.revisionCount,
    archivedAt: dto.archivedAt,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    etag: dto.etag,
  };
}

export function mapTestCase(dto: ApiCase): TestCase {
  const current = mapTestCaseRevision(dto.current);
  return {
    id: dto.id,
    projectId: dto.projectId,
    key: dto.key,
    folderPath: dto.folderPath,
    currentRevision: dto.currentRevision,
    title: current.title,
    type: current.type,
    lifecycle: current.lifecycle,
    priority: current.priority,
    component: current.component,
    ownerIdentityId: current.ownerIdentityId,
    tags: [...current.tags],
    estimatedMinutes: current.estimatedMinutes,
    revisionCount: dto.revisionCount,
    current,
    linkIds: [...dto.linkIds],
    archivedAt: dto.archivedAt,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function mapRevisionSummary(dto: ApiRevisionSummary): RevisionSummary {
  return { ...dto };
}
