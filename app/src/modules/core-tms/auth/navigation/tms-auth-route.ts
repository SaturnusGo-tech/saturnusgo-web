export const TMS_AUTH_ROUTE_PATH = "/testcases/umbrella-home/work/";

export function safeTmsReturnPath(candidate: unknown): string {
  if (
    typeof candidate === "string" &&
    candidate.startsWith(TMS_AUTH_ROUTE_PATH) &&
    !candidate.startsWith("//") &&
    !candidate.includes("\\")
  ) {
    return candidate;
  }
  return TMS_AUTH_ROUTE_PATH;
}
