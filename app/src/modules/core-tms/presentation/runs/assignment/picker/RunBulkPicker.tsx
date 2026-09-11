import { useEffect, useRef, useState } from "react";
import { useWorkspaceMembers } from "../../../../workspace/members/state/useWorkspaceMembers";
import { MemberAvatar } from "../../../../workspace/members/avatar/MemberAvatar";
import { RunFilterOptions } from "../../filters/options/RunFilterOptions";
import css from "../run-assignment.module.css";
export function RunBulkPicker({kind,workspaceId,ru,paths,onChoose}:{kind:"assign"|"move";workspaceId:string;ru:boolean;
  paths:string[];onChoose:(value:string|null)=>void}) {
  const members=useWorkspaceMembers(workspaceId,kind==="assign");const [query,setQuery]=useState("");
  const root=useRef<HTMLDivElement>(null);
  useEffect(()=>{root.current?.querySelector("input")?.focus();},[]);
  const options=kind==="assign"?[{value:"unassigned",label:ru?"Не назначен":"Not assigned"},
    ...members.items.map(m=>({value:m.id,label:m.name,detail:m.email,avatar:<MemberAvatar identityId={m.id} name={m.name}/>}))]
    :[...new Set(["/",...paths])].map(path=>({value:path,label:path==="/"?(ru?"Корень прогона":"Run root"):path}));
  const newPath="/"+query.split("/").map(s=>s.trim()).filter(Boolean).join("/");
  return <div ref={root}><RunFilterOptions label={kind==="assign"?(ru?"Назначить на":"Assign to"):(ru?"Переместить в папку":"Move to folder")}
    placeholder={kind==="assign"?(ru?"Имя или почта":"Name or email"):(ru?"Папка прогона":"Run folder")}
    selected={[]} options={kind==="assign"?options:options.filter(o=>o.label.toLowerCase().includes(query.toLowerCase()))}
    search={kind==="assign"?members.search:query} onSearch={kind==="assign"?members.setSearch:setQuery}
    onChange={value=>onChoose(value==="unassigned"?null:value)}>
    {kind==="assign"&&members.loading&&<div className={css.skeleton} role="status" aria-label={ru?"Загрузка участников":"Loading members"}/>}
    {kind==="assign"&&members.error&&<button type="button" onClick={members.retry}>{ru?"Повторить загрузку":"Retry"}</button>}
    {kind==="assign"&&members.cursor&&<button type="button" disabled={members.loading} onClick={members.more}>{ru?"Загрузить ещё":"Load more"}</button>}
    {kind==="move"&&query.trim()&&!options.some(o=>o.value===newPath)&&<button type="button" className={css.createFolder}
      onClick={()=>onChoose(newPath)}>{ru?"Создать папку":"Create folder"}: {newPath}</button>}
  </RunFilterOptions></div>;
}
