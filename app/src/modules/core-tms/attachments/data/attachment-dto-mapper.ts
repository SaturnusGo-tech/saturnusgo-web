import type { components } from "../../../../core/tms/generated/tms-api";
import type {
  AttachmentMetadata,
  AttachmentOwner,
  AttachmentReadAccess,
} from "../domain/attachment";
import type { PendingAttachmentUpload } from "../application/attachment-transport-port";

type AttachmentDto = components["schemas"]["Attachment"];
type IntentDto = components["schemas"]["AttachmentUploadIntent"];
type AccessDto = components["schemas"]["AttachmentAccess"];

function owner(dto: AttachmentDto["owner"]): AttachmentOwner {
  switch (dto.kind) {
    case "test_case_revision":
      return { kind: dto.kind, caseId: dto.caseId, revisionNo: dto.revisionNo, stepId: dto.stepId };
    case "run":
      return { kind: dto.kind, runId: dto.runId };
    case "run_attempt":
      return {
        kind: dto.kind,
        runId: dto.runId,
        runItemId: dto.runItemId,
        attemptNo: dto.attemptNo,
        stepId: dto.stepId,
      };
    case "defect":
      return { kind: dto.kind, defectId: dto.defectId };
  }
}

export const attachmentDtoMapper = Object.freeze({
  metadata(dto: AttachmentDto): AttachmentMetadata {
    return Object.freeze({
      id: dto.id,
      projectId: dto.projectId,
      owner: owner(dto.owner),
      kind: dto.kind,
      originalFilename: dto.originalFilename,
      mimeType: dto.mimeType,
      trustedExtension: dto.trustedExtension,
      byteSize: dto.byteSize,
      sha256: dto.sha256,
      status: dto.status,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  },
  intent(dto: IntentDto): PendingAttachmentUpload {
    return Object.freeze({
      intentId: dto.intentId,
      attachmentId: dto.attachmentId,
      method: dto.method,
      uploadUrl: dto.uploadUrl,
      headers: Object.freeze({ ...dto.headers }),
      expiresAt: dto.expiresAt,
      mimeType: dto.mimeType,
      maxBytes: dto.maxBytes,
    });
  },
  access(dto: AccessDto): AttachmentReadAccess {
    return Object.freeze({
      attachmentId: dto.attachmentId,
      method: dto.method,
      url: dto.url,
      headers: Object.freeze({ ...dto.headers }),
      expiresAt: dto.expiresAt,
    });
  },
});
