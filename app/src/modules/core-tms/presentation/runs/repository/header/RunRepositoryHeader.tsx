import { Pause, Play, Plus, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { TestRunSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import { RunSelector } from "./RunSelector";
import css from "./run-header.module.css";
export function RunRepositoryHeader({ru,run,choices,value,disabled,startBlocked,onChoose,onCreate,onAction,canManage}:{
  ru:boolean;run?:TestRunSummary;choices:{id:string;name:string;tags:string[];runs:TestRunSummary[]}[];value:string;
  disabled:boolean;startBlocked:boolean;canManage:boolean;onChoose:(id:string)=>void;onCreate:()=>void;
  onAction:(action:"start"|"pause"|"resume"|"complete")=>void;
}) {
  const reduced=useReducedMotion();
  const executable=run && !run.archivedAt && ["draft","active","paused"].includes(run.status);
  const running=run && !run.archivedAt && ["active","paused"].includes(run.status);
  const label=run?.status==="active" ? (ru?"Приостановить прогон":"Pause run") :
    run?.status==="paused" ? (ru?"Продолжить прогон":"Resume run") : (ru?"Запустить прогон":"Start run");
  return <div className={css.header}>
    <RunSelector ru={ru} choices={choices} value={value} onChoose={onChoose} disabled={disabled}/>
    {canManage && <div className={css.actions}>
      <button type="button" className={css.newRun} onClick={onCreate} disabled={disabled}><Plus size={14}/>{ru?"Новый прогон":"New run"}</button>
      {executable && <button type="button" className={css.play} aria-label={label} title={label}
        disabled={disabled || (run.status!=="active" && startBlocked)}
        onClick={()=>onAction(run.status==="active"?"pause":run.status==="paused"?"resume":"start")}>
        {run.status==="active"?<Pause size={15}/>:<Play size={15} fill="currentColor"/>}</button>}
      <AnimatePresence initial={false}>{running && <motion.button key="complete" type="button" className={css.finish}
        aria-label={ru?"Завершить прогон":"Complete run"} title={ru?"Завершить прогон":"Complete run"}
        initial={{opacity:0,scale:reduced?1:.85,width:0,marginLeft:-6}} animate={{opacity:1,scale:1,width:34,marginLeft:0}}
        exit={{opacity:0,scale:reduced?1:.85,width:0,marginLeft:-6}} transition={{duration:reduced?0:.2}}
        disabled={disabled} onClick={()=>onAction("complete")}><X size={16}/></motion.button>}</AnimatePresence>
    </div>}
  </div>;
}
