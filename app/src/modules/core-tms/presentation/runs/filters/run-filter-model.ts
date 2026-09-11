import type { RunRepositoryEntry } from "../../../runs/batches/model/repository/run-repository";
export type RunFilterState={owners:string[];projects:string[];results:string[];folders:string[];components:string[];
  types:string[];priorities:string[];statuses:string[];tags:string[];groups:string[]};
export const emptyRunFilters=():RunFilterState=>({owners:[],projects:[],results:[],folders:[],components:[],types:[],priorities:[],statuses:[],tags:[],groups:["project"]});
export function matchesRunFilters(row:RunRepositoryEntry, f:RunFilterState) {
  const c=row.testCase;const includes=(values:readonly string[],value:string)=>!values.length||values.includes(value);
  return includes(f.projects,row.projectId)&&includes(f.results,row.item.status)&&includes(f.owners,row.item.assigneeIdentityId??"unassigned")
    &&includes(f.types,c.type)&&includes(f.priorities,c.priority)&&includes(f.statuses,c.lifecycle)
    &&includes(f.components,c.component)&&(!f.tags.length||c.tags.some(tag=>f.tags.includes(tag)))
    &&(!f.folders.length||f.folders.some(path=>path==="/"||c.folderPath===path||c.folderPath.startsWith(path+"/")));
}
export function toggleRunFilter(values:readonly string[],value:string):string[] {
  return value==="all"?[]:values.includes(value)?values.filter(v=>v!==value):[...values,value];
}
