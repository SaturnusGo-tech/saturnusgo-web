export type VariableCompletion = { readonly start: number; readonly end: number; readonly query: string };
export function findVariableCompletion(text: string, caret: number): VariableCompletion | null {
  const before = text.slice(0, caret);
  const match = /\{\{([A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z0-9_]*)?|)$/.exec(before);
  if (!match) return null;
  const start = match.index;
  let slashes = 0;
  for (let index = start - 1; index >= 0 && text[index] === "\\"; index--) slashes++;
  return slashes % 2 ? null : { start, end: caret, query: match[1] };
}
export function insertVariableCompletion(text: string, completion: VariableCompletion, token: string) {
  const replacement = `{{${token}}}`;
  const end = text.slice(completion.end).startsWith("}}") ? completion.end + 2 : completion.end;
  return { value: text.slice(0, completion.start) + replacement + text.slice(end), caret: completion.start + replacement.length };
}
