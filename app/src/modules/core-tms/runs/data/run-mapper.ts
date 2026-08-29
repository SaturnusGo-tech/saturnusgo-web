import type { components } from "../../../../core/tms/generated/tms-api";
import type {
  RunAttempt,
  RunAttemptSummary,
  RunItem,
  RunItemSummary,
  TestRunSummary,
} from "../../../../core/tms/contracts/legacy-contract";
import { mapTestCaseRevision } from "../../test-cases/data/test-case-mapper";

type Api = components["schemas"];

export function mapRun(dto: Api["Run"]): TestRunSummary {
  return {
    id: dto.id,
    projectId: dto.projectId,
    key: dto.key,
    name: dto.name,
    description: dto.description,
    type: dto.type,
    status: dto.status,
    environment: {
      id: dto.environment.id,
      key: dto.environment.key,
      name: dto.environment.name,
      baseUrl: dto.environment.baseUrl,
    },
    suiteId: dto.suiteId,
    build: dto.build,
    configuration: { ...dto.configuration },
    itemCount: dto.itemCount,
    progress: {
      total: dto.progress.total,
      executed: dto.progress.executed,
      percent: dto.progress.percent,
      counts: { ...dto.progress.counts },
    },
    createdAt: dto.createdAt,
    startedAt: dto.startedAt,
    completedAt: dto.completedAt,
    archivedAt: dto.archivedAt,
    archivedBy: dto.archivedBy,
    archiveReason: dto.archiveReason,
  };
}

export function mapRunItemSummary(dto: Api["RunItemSummary"]): RunItemSummary {
  return {
    id: dto.id,
    caseId: dto.caseId,
    caseKey: dto.caseKey,
    revision: dto.revision,
    assigneeIdentityId: dto.assigneeIdentityId,
    status: dto.status,
    attemptCount: dto.attemptCount,
    activeAttemptNo: dto.activeAttemptNo,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function mapRunAttemptSummary(dto: Api["RunAttemptSummary"]): RunAttemptSummary {
  return {
    attemptNo: dto.attemptNo,
    status: dto.status,
    actualResult: dto.actualResult,
    comment: dto.comment,
    blockedReason: dto.blockedReason,
    attachmentIds: [...dto.attachmentIds],
    startedAt: dto.startedAt,
    completedAt: dto.completedAt,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function mapRunAttempt(dto: Api["RunAttempt"]): RunAttempt {
  return {
    ...mapRunAttemptSummary(dto),
    stepResults: dto.stepResults.map((result) => ({
      ...result,
      attachmentIds: [...result.attachmentIds],
    })),
  };
}

export function mapRunItem(dto: Api["RunItem"]): RunItem {
  return {
    ...mapRunItemSummary(dto),
    snapshot: mapTestCaseRevision(dto.snapshot),
    attempts: [mapRunAttempt(dto.activeAttempt)],
  };
}
