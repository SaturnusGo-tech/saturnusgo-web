export type CaseReference = { readonly id: string; readonly projectId: string; readonly key: string; readonly title: string };
export type CaseReferenceScope = { readonly workspaceId: string; readonly projectId: string };
export type CaseKeyMatch = { readonly key: string; readonly start: number; readonly end: number };
const MARKER = "#falcon-case-key=";
const CASE_KEY = /(?<![\p{L}\p{N}_/.-])([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*-TC-[1-9]\d*)(?![\p{L}\p{N}_-])/giu;

/** URLs and email addresses are authored destinations, not implicit case references. */
export function findCaseKeys(text: string): CaseKeyMatch[] {
  const excluded = [...text.matchAll(/(?:https?:\/\/|mailto:|www\.)\S+|\S+@\S+/gi)]
    .map(match => ({ start: match.index, end: match.index + match[0].length }));
  return [...text.matchAll(CASE_KEY)].filter(match => !excluded.some(range =>
    match.index >= range.start && match.index < range.end)).slice(0, 64)
    .map(match => ({ key: match[0].toUpperCase(), start: match.index, end: match.index + match[0].length }));
}

export const caseReferenceMarker = (key: string) => `${MARKER}${encodeURIComponent(key)}`;
export function readCaseReferenceMarker(href: string | undefined): string | null {
  if (!href?.startsWith(MARKER)) return null;
  try {
    const value = decodeURIComponent(href.slice(MARKER.length));
    const matches = findCaseKeys(value);
    return matches.length === 1 && matches[0].start === 0 && matches[0].end === value.length ? matches[0].key : null;
  } catch { return null; }
}

export function caseReferenceHref(reference: CaseReference, scope: CaseReferenceScope, origin: string) {
  const url = new URL("/work/", origin);
  url.search = new URLSearchParams({ workspaceId: scope.workspaceId, projectId: reference.projectId,
    view: "cases", caseId: reference.id }).toString();
  return url.href;
}
