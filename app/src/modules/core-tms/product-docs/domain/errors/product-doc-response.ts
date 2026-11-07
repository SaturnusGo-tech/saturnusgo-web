export function productDocErrorCode(error: unknown): string | undefined {
  return error && typeof error === "object" && "code" in error && typeof error.code === "string"
    ? error.code
    : undefined;
}

export function isMissingProductDoc(error: unknown): boolean {
  return !!error && typeof error === "object" && "status" in error && error.status === 404;
}
