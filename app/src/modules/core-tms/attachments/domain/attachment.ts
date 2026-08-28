export type AttachmentKind = "file" | "screenshot" | "video" | "log";

export type AttachmentMimeType =
  | "image/png"
  | "image/jpeg"
  | "image/webp"
  | "image/gif"
  | "video/mp4"
  | "video/webm"
  | "video/quicktime"
  | "text/plain"
  | "application/pdf"
  | "application/json"
  | "application/zip"
  | "application/gzip"
  | "application/octet-stream";

export type AttachmentOwner =
  | { readonly kind: "test_case_revision"; readonly caseId: string; readonly revisionNo: number; readonly stepId?: string }
  | { readonly kind: "run"; readonly runId: string }
  | {
      readonly kind: "run_attempt";
      readonly runId: string;
      readonly runItemId: string;
      readonly attemptNo: number;
      readonly stepId?: string;
    }
  | { readonly kind: "defect"; readonly defectId: string };

export interface AttachmentMetadata {
  readonly id: string;
  readonly projectId: string;
  readonly owner: AttachmentOwner;
  readonly kind: AttachmentKind;
  readonly originalFilename: string;
  readonly mimeType: AttachmentMimeType;
  readonly trustedExtension: string;
  readonly byteSize: number;
  readonly sha256: string | null;
  readonly status: "pending" | "ready" | "failed" | "quarantined" | "deleting" | "deleted";
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AttachmentReadAccess {
  readonly attachmentId: string;
  readonly method: "GET";
  readonly url: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly expiresAt: string;
}

export interface UploadPrivateAttachmentInput {
  readonly projectId: string;
  readonly owner: AttachmentOwner;
  readonly kind: AttachmentKind;
  readonly mimeType: AttachmentMimeType;
  readonly file: File;
  readonly operationKey: string;
  readonly requestId?: string;
  readonly signal?: AbortSignal;
}

export interface CreateAttachmentAccessInput {
  readonly attachmentId: string;
  readonly disposition?: "inline" | "attachment";
  readonly fileName?: string;
  readonly requestId?: string;
  readonly signal?: AbortSignal;
}
