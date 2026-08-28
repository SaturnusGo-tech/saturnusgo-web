import type {
  AttachmentMetadata,
  AttachmentMetadataResource,
  AttachmentReadAccess,
  CreateAttachmentAccessInput,
  RemovePrivateAttachmentInput,
  UploadPrivateAttachmentInput,
} from "../domain/attachment";
import { AttachmentClientError } from "../domain/attachment-client-error";
import type { AttachmentTransportPort } from "./attachment-transport-port";

export interface PrivateAttachmentClient {
  getMetadata(attachmentId: string, signal?: AbortSignal): Promise<AttachmentMetadataResource>;
  upload(input: UploadPrivateAttachmentInput): Promise<AttachmentMetadata>;
  createAccess(input: CreateAttachmentAccessInput): Promise<AttachmentReadAccess>;
  remove(input: RemovePrivateAttachmentInput): Promise<AttachmentMetadataResource>;
}

export interface PrivateAttachmentClientDependencies {
  readonly transport: AttachmentTransportPort;
  readonly digest: (file: Blob, signal?: AbortSignal) => Promise<string>;
  readonly now?: () => number;
}

const operationKeyPattern = /^[A-Za-z0-9._:-]{9,115}$/;
const digestPattern = /^[a-f0-9]{64}$/;

function validFile(input: UploadPrivateAttachmentInput): void {
  if (!Number.isSafeInteger(input.file.size) || input.file.size < 1) {
    throw new AttachmentClientError("INVALID_CLIENT_INPUT", "Attachment must not be empty.");
  }
  if (input.file.type && input.file.type !== input.mimeType) {
    throw new AttachmentClientError("INVALID_CLIENT_INPUT", "Attachment MIME type does not match the file.");
  }
}

export function createPrivateAttachmentClient(
  dependencies: PrivateAttachmentClientDependencies,
): PrivateAttachmentClient {
  const now = dependencies.now ?? Date.now;
  return Object.freeze({
    getMetadata(attachmentId: string, signal?: AbortSignal): Promise<AttachmentMetadataResource> {
      return dependencies.transport.getMetadata(attachmentId, signal);
    },
    async upload(input: UploadPrivateAttachmentInput): Promise<AttachmentMetadata> {
      validFile(input);
      const operationKey = input.operationKey;
      if (!operationKeyPattern.test(operationKey)) {
        throw new AttachmentClientError("INVALID_CLIENT_INPUT", "Attachment operation key is invalid.");
      }
      const sha256 = await dependencies.digest(input.file, input.signal);
      if (!digestPattern.test(sha256)) {
        throw new AttachmentClientError("INVALID_CLIENT_INPUT", "Attachment digest provider returned an invalid digest.");
      }
      const created = await dependencies.transport.createUploadIntent({
        projectId: input.projectId,
        owner: input.owner,
        kind: input.kind,
        originalFilename: input.file.name,
        mimeType: input.mimeType,
        byteSize: input.file.size,
        sha256,
        idempotencyKey: `intent:${operationKey}`,
        requestId: input.requestId,
        signal: input.signal,
      });
      const intentExpiry = Date.parse(created.intent.expiresAt);
      if (
        created.intent.mimeType !== input.mimeType ||
        input.file.size > created.intent.maxBytes ||
        !Number.isFinite(intentExpiry) ||
        intentExpiry <= now()
      ) {
        throw new AttachmentClientError("UPLOAD_INTENT_EXPIRED", "Attachment upload intent is unusable.");
      }
      const storageETag = await dependencies.transport.uploadPrivateObject(
        created.intent,
        input.file,
        input.signal,
      );
      return dependencies.transport.finalizeUpload({
        intent: created.intent,
        byteSize: input.file.size,
        sha256,
        storageETag,
        intentETag: created.etag,
        idempotencyKey: `finalize:${operationKey}`,
        requestId: input.requestId,
        signal: input.signal,
      });
    },
    async createAccess(input: CreateAttachmentAccessInput): Promise<AttachmentReadAccess> {
      const access = await dependencies.transport.createAccess(input);
      let target: URL;
      try { target = new URL(access.url); } catch {
        throw new AttachmentClientError("INVALID_API_RESPONSE", "Attachment access URL is invalid.");
      }
      const expiresAt = Date.parse(access.expiresAt);
      if (target.protocol !== "https:" || target.username || target.password ||
          !Number.isFinite(expiresAt) || expiresAt <= now() || Object.keys(access.headers).length > 0) {
        throw new AttachmentClientError("INVALID_API_RESPONSE", "Attachment access is unsafe or expired.");
      }
      return access;
    },
    remove(input: RemovePrivateAttachmentInput): Promise<AttachmentMetadataResource> {
      if (!operationKeyPattern.test(input.operationKey)) {
        throw new AttachmentClientError("INVALID_CLIENT_INPUT", "Attachment operation key is invalid.");
      }
      if (!/^"[^"]+"$/.test(input.etag)) {
        throw new AttachmentClientError("INVALID_CLIENT_INPUT", "Attachment ETag is invalid.");
      }
      return dependencies.transport.remove(input);
    },
  });
}
