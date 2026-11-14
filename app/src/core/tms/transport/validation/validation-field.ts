export function validationField(details: unknown): string | null {
  const issue = Array.isArray(details) ? details[0] : details;
  if (typeof issue !== "object" || issue === null || !("field" in issue)) return null;
  if (typeof issue.field !== "string") return null;
  const field = issue.field.trim();
  if (field.length === 0 || field.length > 128) return null;
  if (Array.isArray(details) && !/^[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)*$/.test(field)) return null;
  return field;
}
