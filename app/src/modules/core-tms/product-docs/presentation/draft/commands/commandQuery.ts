export function productDocCommandQuery(text: string): string | null {
  return /^\/[\p{L}\p{N} ]{0,36}$/u.test(text) ? text.slice(1).trim().toLowerCase() : null;
}
