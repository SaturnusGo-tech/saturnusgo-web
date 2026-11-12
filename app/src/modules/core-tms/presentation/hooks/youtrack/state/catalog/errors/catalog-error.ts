export type YouTrackCatalogIssue = "empty_fields" | "request_failed" | null;
export class EmptyYouTrackFieldsError extends Error {}
export const catalogIssueFor = (error: unknown): Exclude<YouTrackCatalogIssue, null> =>
  error instanceof EmptyYouTrackFieldsError ? "empty_fields" : "request_failed";
