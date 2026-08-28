import type {
  AttachmentKind,
  AttachmentMetadata,
  AttachmentMimeType,
  AttachmentOwner,
  AttachmentReadAccess,
  CreateAttachmentAccessInput,
} from "../domain/attachment";

export interface PendingAttachmentUpload {
  readonly intentId: string;
  readonly attachmentId: string;
  readonly method: "PUT";
  readonly uploadUrl: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly expiresAt: string;
  readonly mimeType: AttachmentMimeType;
  readonly maxBytes: number;
}

export interface CreateUploadIntentInput {
  readonly projectId: string;
  readonly owner: AttachmentOwner;
  readonly kind: AttachmentKind;
  readonly originalFilename: string;
  readonly mimeType: AttachmentMimeType;
  readonly byteSize: number;
  readonly sha256: string;
  readonly idempotencyKey: string;
  readonly requestId?: string;
  readonly signal?: AbortSignal;
}

export interface FinalizeUploadInput {
  readonly intent: PendingAttachmentUpload;
  readonly byteSize: number;
  readonly sha256: string;
  readonly storageETag: string;
  readonly intentETag: string;
  readonly idempotencyKey: string;
  readonly requestId?: string;
  readonly signal?: AbortSignal;
}

export interface AttachmentTransportPort {
  createUploadIntent(input: CreateUploadIntentInput): Promise<{
    readonly intent: PendingAttachmentUpload;
    readonly etag: string;
  }>;
  uploadPrivateObject(
    intent: PendingAttachmentUpload,
    file: File,
    signal?: AbortSignal,
  ): Promise<string>;
  finalizeUpload(input: FinalizeUploadInput): Promise<AttachmentMetadata>;
  createAccess(input: CreateAttachmentAccessInput): Promise<AttachmentReadAccess>;
}
