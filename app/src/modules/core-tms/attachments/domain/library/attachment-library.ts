import type { components } from "../../../../../core/tms/generated/tms-api";

export type AttachmentLibraryKind = components["schemas"]["AttachmentLibraryKind"];
export type LibraryAttachment = components["schemas"]["AttachmentLibraryItem"];
export type AttachmentLibraryPage = components["schemas"]["AttachmentLibraryPage"];

export const attachmentKinds = ["spreadsheet", "pdf", "image", "video", "audio", "archive", "document", "other"] as const satisfies readonly AttachmentLibraryKind[];
