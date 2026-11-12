import { ImportSourceError } from "../../import-source-error";
type SourceObject = Record<string, unknown>;
const object = (value: unknown): SourceObject | undefined => value && typeof value === "object" && !Array.isArray(value) ? value as SourceObject : undefined;
const incomplete = (): never => { throw new ImportSourceError("IMPORT_INCOMPLETE_PROVIDER"); };

export function rejectPartialProvider(source: SourceObject): void {
  if (Array.isArray(source.issues) && ("isLast" in source || "startAt" in source || source.issues.some(issue => typeof object(issue)?.key === "string" && object(object(issue)?.fields)))) {
    if (source.isLast === false || source.nextPageToken || (typeof source.startAt === "number" && source.startAt > 0)
      || (typeof source.total === "number" && source.total > source.issues.length)) incomplete();
  }
  const issues = object(object(source.data)?.issues);
  if (issues && (Array.isArray(issues.nodes) || Array.isArray(issues.edges))) {
    if (object(issues.pageInfo)?.hasNextPage === true || (Array.isArray(source.errors) && source.errors.length)) incomplete();
  }
  if (Array.isArray(source.cases) && (object(source._links) || source.cases.some(item => object(item) && ("custom_steps_separated" in object(item)! || "section_id" in object(item)!)))) {
    if (object(source._links)?.next || (typeof source.offset === "number" && source.offset > 0)
      || (typeof source.total === "number" && source.total > source.cases.length)) incomplete();
    for (const item of source.cases) {
      const steps = object(item)?.custom_steps_separated;
      if (Array.isArray(steps) && steps.some(step => {
        const value = object(step);
        return value && value.shared_step_id != null && value.shared_step_id !== 0 && !(typeof value.content === "string" && value.content.trim());
      })) incomplete();
    }
  }
}
