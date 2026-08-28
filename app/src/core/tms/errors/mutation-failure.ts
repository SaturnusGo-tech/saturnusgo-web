import { TmsApiError } from "../transport/http";

export type TmsMutationFailure = Readonly<{
  message: string | null;
  code: string | null;
  requestId: string | null;
}>;

export function toTmsMutationFailure(error: unknown): TmsMutationFailure {
  if (!(error instanceof TmsApiError)) {
    return { message: null, code: null, requestId: null };
  }
  return {
    message: error.message,
    code: error.code,
    requestId: error.requestId,
  };
}

export function formatTmsMutationFailure(
  failure: TmsMutationFailure,
  fallback: string,
): string {
  const diagnostics = [
    failure.code,
    failure.requestId ? `requestId=${failure.requestId}` : null,
  ].filter((value): value is string => Boolean(value));
  const message = failure.message ?? fallback;
  return diagnostics.length > 0 ? `${message} [${diagnostics.join(" · ")}]` : message;
}
