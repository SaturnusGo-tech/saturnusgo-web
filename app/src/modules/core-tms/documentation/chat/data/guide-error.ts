import { TmsApiError } from "../../../../../core/tms/transport/http";

export function guideError(error: unknown): "unavailable" | "forbidden" | "signedOut" | "limited" | "invalid" {
  if (error instanceof TmsApiError) {
    if (error.status === 401) return "signedOut";
    if (error.status === 403) return "forbidden";
    if (error.status === 429) return "limited";
    if (error.status === 400 || error.status === 422) return "invalid";
  }
  return "unavailable";
}
