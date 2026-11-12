import { LegacyYouTrackMappingError } from "./legacy-mapping-error";
import { MissingYouTrackFieldError } from "./fields/missing-configured-field-error";
export type YouTrackCatalogIssue = "empty_fields" | "missing_field" | "legacy_mapping" | "request_failed" | null;
export class EmptyYouTrackFieldsError extends Error {}
export function catalogIssueFor(error: unknown): Exclude<YouTrackCatalogIssue, null> {
  if (error instanceof EmptyYouTrackFieldsError) return "empty_fields";
  if (error instanceof MissingYouTrackFieldError) return "missing_field";
  if (error instanceof LegacyYouTrackMappingError) return "legacy_mapping";
  return "request_failed";
}
