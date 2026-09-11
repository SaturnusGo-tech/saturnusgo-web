import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { TestRunSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import { localizedLabel } from "../../../../localization/format/labels";
import { RunFilterOptions } from "../../filters/options/RunFilterOptions";
import css from "./run-header.module.css";
export function RunSelector({ru,choices,value,onChoose,disabled}:{ru:boolean;value:string;disabled:boolean;
  choices:{id:string;name:string;tags:string[];runs:TestRunSummary[]}[];onChoose:(id:string)=>void}) {
  const [open,setOpen]=useState(false);const root=useRef<HTMLDivElement>(null);const trigger=useRef<HTMLButtonElement>(null);
  const selected=choices.find(c=>c.id===value);const run=selected?.runs[0];
  const status=run?.archivedAt?(ru?"Архив":"Archived"):run?.status==="paused"?(ru?"Пауза":"Paused"):localizedLabel(ru?"ru":"en",run?.status??"draft");
  useEffect(()=>{if(!open)return;root.current?.querySelector("input")?.focus();
    const close=(e:PointerEvent)=>{if(!root.current?.contains(e.target as Node))setOpen(false);};
    document.addEventListener("pointerdown",close);return()=>document.removeEventListener("pointerdown",close);},[open]);
  return <div className={css.selector} ref={root} onKeyDown={e=>{if(e.key==="Escape"){e.stopPropagation();setOpen(false);trigger.current?.focus();}}}>
    <span className={css.caption}>{ru?"Текущий прогон":"Current run"}</span>
    <button ref={trigger} type="button" className={css.current} aria-haspopup="listbox" aria-expanded={open} disabled={disabled}
      onClick={()=>setOpen(!open)}><strong>{selected?.name??(ru?"Выберите прогон":"Choose a run")}</strong><ChevronDown size={13}/>
      {run && <span className={css.status} data-status={run.status}>{status}</span>}</button>
    {open && <div className={css.menu}><RunFilterOptions label={ru?"Прогоны":"Runs"} selected={[value]}
      placeholder={ru?"Найти прогон или тег":"Find run or tag"}
      options={choices.map(c=>({value:c.id,label:c.name,detail:[c.runs[0]?.archivedAt?(ru?"Архив":"Archived"):localizedLabel(ru?"ru":"en",c.runs[0]?.status??"draft"),...c.tags].join(" · ")}))}
      onChange={id=>{onChoose(id);setOpen(false);trigger.current?.focus();}}/></div>}
  </div>;
}
