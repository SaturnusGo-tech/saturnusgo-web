export type AttachmentClientErrorCode =
  | "AUTHENTICATION_REQUIRED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "BAD_REQUEST"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INVALID_TRANSITION"
  | "PRECONDITION_REQUIRED"
  | "PRECONDITION_FAILED"
  | "IDEMPOTENCY_KEY_REUSED"
  | "UPLOAD_INTENT_EXPIRED"
  | "ATTACHMENT_DIGEST_MISMATCH"
  | "PAYLOAD_TOO_LARGE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "INTERNAL_ERROR"
  | "INVALID_CLIENT_INPUT"
  | "INVALID_API_RESPONSE"
  | "DIRECT_UPLOAD_FAILED";

export class AttachmentClientError extends Error {
  constructor(
    readonly code: AttachmentClientErrorCode,
    message: string,
    readonly status: number | null = null,
    readonly requestId: string | null = null,
  ) {
    super(message);
    this.name = "AttachmentClientError";
  }
}
