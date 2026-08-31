import { TmsApiError } from "../../../../core/tms/transport/http";
import type { TmsLocale } from "../../localization/model/locale";

export function describeDefectCreateError(
  error: unknown,
  fallback: string,
  locale: TmsLocale,
): string {
  if (!(error instanceof TmsApiError)) return fallback;
  if (!error.requestId) return error.message;
  const label = locale === "ru" ? "ID запроса" : "Request ID";
  return `${error.message} (${label}: ${error.requestId})`;
}
