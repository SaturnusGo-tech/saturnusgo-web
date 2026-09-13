import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { TestRunSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import { localizedLabel } from "../../../../localization/format/labels";
import { RunFilterOptions } from "../../filters/options/RunFilterOptions";
import { isHistoricalRunChoice } from "../../../../runs/model/history/run-history";
import css from "./run-header.module.css";
export function RunSelector({ru,choices,value,onChoose,disabled}:{ru:boolean;value:string;disabled:boolean;
  choices:{id:string;name:string;tags:string[];runs:TestRunSummary[]}[];onChoose:(id:string)=>void}) {
  const [open,setOpen]=useState(false);const root=useRef<HTMLDivElement>(null);const trigger=useRef<HTMLButtonElement>(null);
  const [archiveOpen, setArchiveOpen] = useState(false); const [query, setQuery] = useState("");
  const selected=choices.find(c=>c.id===value);const run=selected?.runs[0];
  const statusLabel=(run?:TestRunSummary)=>run?.archivedAt?(ru?"Архив":"Archived"):run?.status==="paused"?(ru?"Пауза":"Paused"):localizedLabel(ru?"ru":"en",run?.status??"draft");
  const status=statusLabel(run);
  const matches = choices.filter(choice => `${choice.name} ${choice.tags.join(" ")}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const working = matches.filter(choice => !isHistoricalRunChoice(choice));
  const archived = matches.filter(isHistoricalRunChoice);
  const archiveCount = choices.filter(isHistoricalRunChoice).length;
  const options = (list: typeof choices) => list.map(c => ({value:c.id,label:c.name,detail:[statusLabel(c.runs[0]),...c.tags].join(" · ")}));
  const choose = (id: string) => { onChoose(id); setOpen(false); trigger.current?.focus(); };
  useEffect(()=>{if(!open)return;root.current?.querySelector("input")?.focus();
    const close=(e:PointerEvent)=>{if(!root.current?.contains(e.target as Node))setOpen(false);};
    document.addEventListener("pointerdown",close);return()=>document.removeEventListener("pointerdown",close);},[open]);
  return <div className={css.selector} ref={root} onKeyDown={e=>{if(e.key==="Escape"){e.stopPropagation();setOpen(false);trigger.current?.focus();}}}>
    <span className={css.caption}>{ru?"Текущий прогон":"Current run"}</span>
    <button ref={trigger} type="button" className={css.current} aria-haspopup="listbox" aria-expanded={open} disabled={disabled}
      onClick={()=>{if(!open){setArchiveOpen(false);setQuery("");}setOpen(!open);}}><strong>{selected?.name??(ru?"Выберите прогон":"Choose a run")}</strong><ChevronDown size={13}/>
      {run && <span className={css.status} data-status={run.status}>{status}</span>}</button>
    {open && <div className={css.menu}>
      <label className={css.search}><Search size={14} aria-hidden="true"/><input
        aria-label={ru?"Найти прогон или тег":"Find run or tag"} placeholder={ru?"Найти прогон или тег":"Find run or tag"}
        value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==="ArrowDown"){e.preventDefault();root.current?.querySelector<HTMLButtonElement>("[role=option], [data-archive-toggle]")?.focus();}}}/></label>
      <RunFilterOptions label={ru?"Текущие прогоны":"Current runs"} selected={[value]} options={options(working)} onChange={choose}/>
      {!working.length && <p className={css.empty}>{query ? (ru?"Нет текущих прогонов по запросу":"No current runs match") : (ru?"Нет текущих прогонов":"No current runs")}</p>}
      {archiveCount > 0 && <>
        <button type="button" data-archive-toggle className={css.archiveToggle} aria-expanded={archiveOpen}
          onClick={()=>setArchiveOpen(!archiveOpen)}><span>{ru?"Архивные раны":"Archived runs"}</span>
          <ChevronDown size={14} className={archiveOpen?css.expanded:undefined}/><small>{query?archived.length:archiveCount}</small></button>
        {archiveOpen && <div className={css.archiveList}><RunFilterOptions label={ru?"Архивные раны":"Archived runs"} selected={[value]} options={options(archived)} onChange={choose}/>
          {!archived.length && <p className={css.empty}>{ru?"Нет архивных прогонов по запросу":"No archived runs match"}</p>}</div>}
      </>}
    </div>}
  </div>;
}
