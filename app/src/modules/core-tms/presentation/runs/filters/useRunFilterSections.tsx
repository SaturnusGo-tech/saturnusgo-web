import { useEffect, useState } from "react";
import { Bot, Box, CircleCheck, CircleDot, Flag, Folder, FolderKanban, ListTree, Tags, Users } from "lucide-react";
import type { RunRepositoryEntry } from "../../../runs/batches/model/repository/run-repository";
import { localizedLabel, localizedComponentLabel } from "../../../localization/format/labels";
import type { ExtraFilterSection } from "../../cases/toolbar/CasesToolbarPopovers";
import { RunFilterOptions } from "./options/RunFilterOptions";
import { RunAssigneeFilter } from "./assignee/RunAssigneeFilter";
import { emptyRunFilters, matchesRunFilters, toggleRunFilter, type RunFilterState } from "./run-filter-model";
export function useRunFilterSections({workspaceId,scope,projects,rows,ru}:{workspaceId:string;scope:string;
  projects:readonly {id:string;name:string}[];rows:RunRepositoryEntry[];ru:boolean}) {
  const [filters,setFilters]=useState(emptyRunFilters);
  useEffect(()=>setFilters(emptyRunFilters()),[workspaceId,scope]);
  const change=(field:keyof RunFilterState,value:string)=>setFilters(f=>({...f,[field]:toggleRunFilter(f[field],value)}));
  const all=ru?"Все":"All";const label=(v:string)=>localizedLabel(ru?"ru":"en",v);
  const unique=(values:string[])=>[...new Set(values)].sort().map(value=>({value,label:value}));
  const enumOptions=(values:string[])=>values.map(value=>({value,label:label(value)}));
  const definitions:{id:keyof RunFilterState;label:string;icon:React.ReactNode;options:{value:string;label:string}[]}[]=[
    {id:"projects",label:ru?"Проекты":"Projects",icon:<FolderKanban size={13}/>,options:projects.map(p=>({value:p.id,label:p.name}))},
    {id:"results",label:ru?"Результаты":"Results",icon:<CircleCheck size={13}/>,options:enumOptions(["not_run","in_progress","passed","failed","blocked","skipped"])},
    {id:"groups",label:ru?"Группировка":"Group by",icon:<ListTree size={13}/>,options:[{value:"project",label:ru?"По проектам":"By project"},{value:"component",label:ru?"По компонентам":"By component"},{value:"tag",label:ru?"По тегам":"By tag"}]},
    {id:"folders",label:ru?"Папки":"Folders",icon:<Folder size={13}/>,options:unique(rows.flatMap(r=>{
      const parts=r.testCase.folderPath.split("/").filter(Boolean);return ["/",...parts.map((_,i)=>"/"+parts.slice(0,i+1).join("/"))];}))},
    {id:"components",label:ru?"Компоненты":"Components",icon:<Box size={13}/>,options:unique(rows.map(r=>r.testCase.component)).map(o=>({...o,label:o.value?localizedComponentLabel(ru?"ru":"en",o.value):(ru?"Без компонента":"No component")}))},
    {id:"types",label:ru?"Тип":"Type",icon:<Bot size={13}/>,options:enumOptions(["manual","checklist","automated"])},
    {id:"priorities",label:ru?"Приоритет":"Priority",icon:<Flag size={13}/>,options:enumOptions(["critical","high","medium","low"])},
    {id:"statuses",label:ru?"Статус":"Status",icon:<CircleDot size={13}/>,options:enumOptions(["ready","draft","deprecated"])},
    {id:"tags",label:ru?"Теги":"Tags",icon:<Tags size={13}/>,options:unique(rows.flatMap(r=>r.testCase.tags))},
  ];
  const sections:ExtraFilterSection[]=[{id:"assignee",label:ru?"Ответственные":"Assignees",icon:<Users size={13}/>,
    active:!!filters.owners.length,summary:filters.owners.length?String(filters.owners.length):all,
    render:()=> <RunAssigneeFilter workspaceId={workspaceId} selected={filters.owners} onChange={value=>change("owners",value)} ru={ru}/>},
    ...definitions.map(d=>({id:d.id,label:d.label,icon:d.icon,active:d.id==="groups"?filters.groups.join()!=="project":!!filters[d.id].length,
      summary:filters[d.id].length?String(filters[d.id].length):d.id==="groups"?(ru?"Без группировки":"None"):all,
      render:()=> <RunFilterOptions label={d.label} multiple selected={filters[d.id].length?filters[d.id]:["all"]}
        options={[{value:"all",label:d.id==="groups"?(ru?"Без группировки":"No grouping"):all},...d.options]}
        placeholder={ru?"Поиск":"Search"} onChange={value=>change(d.id,value)}/>}))];
  return {sections,group:filters.groups,matches:(row:RunRepositoryEntry)=>matchesRunFilters(row,filters),reset:()=>setFilters(emptyRunFilters())};
}
