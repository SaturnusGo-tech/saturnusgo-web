import { createPortal } from "react-dom";
import { Archive, ArrowRight, FolderInput, Flag, UserRoundPlus, X, ArchiveRestore } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { useRunAssignments } from "../../../runs/assignment/state/useRunAssignments";
import { RunBulkPopover } from "./picker/RunBulkPopover";
import { RunBulkPicker } from "./picker/RunBulkPicker";
import { localizedLabel } from "../../../localization/format/labels";
import { BulkActionMenu } from "../../cases/bulk/action/BulkActionMenu";
import styles from "../../cases/bulk/styles/caseBulk.module.css";
import css from "./run-assignment.module.css";
export function RunAssignmentTools({state,workspaceId,ru,allowed,disabled,paths,archived}:{
  state:ReturnType<typeof useRunAssignments>;workspaceId:string;ru:boolean;allowed:boolean;disabled:boolean;
  paths:string[];archived:boolean;
}) {
  const [menu,setMenu]=useState<"assign"|"move"|"priority"|null>(null);
  const anchor=useRef<HTMLSpanElement>(null);const [host,setHost]=useState<HTMLElement|null>(null);
  useEffect(()=>{setHost(anchor.current?.closest<HTMLElement>('[data-testid="runs-view"]')??null);},[]);
  const root=useRef<HTMLDivElement>(null);const trigger=useRef<HTMLButtonElement|null>(null);
  const locked=state.busy||disabled;
  useEffect(()=>{if(!menu)return;const close=(e:PointerEvent)=>{if(!root.current?.contains(e.target as Node))setMenu(null);};
    document.addEventListener("pointerdown",close);return()=>document.removeEventListener("pointerdown",close);},[menu]);
  useEffect(()=>{if(!state.selected.size)setMenu(null);},[state.selected.size]);
  if(!allowed||!state.selecting||!state.selected.size||!host)return <span hidden ref={anchor}/>;
  const close=()=>{setMenu(null);trigger.current?.focus();};
  const open=(kind:typeof menu,event:React.MouseEvent<HTMLButtonElement>)=>{trigger.current=event.currentTarget;setMenu(menu===kind?null:kind);};
  return <><span hidden ref={anchor}/>{createPortal(<div className={css.dock} data-run-bulk data-bulk-active="true"><div ref={root} className={`${styles.bulkBar} ${css.bar}`} role="region" aria-label={ru?"Действия с выбранными кейсами прогона":"Selected run case actions"}
    onKeyDown={e=>{if(e.key==="Escape"){e.stopPropagation();close();}}} aria-busy={state.busy}>
    <span className={styles.bulkCount}>{ru?"Выбрано":"Selected"}: {state.selected.size}</span>
    <div className={styles.bulkMenuRoot}>
      <button type="button" className={styles.bulkPrimary} aria-haspopup="listbox" aria-expanded={menu==="assign"} disabled={locked||archived}
        onClick={e=>open("assign",e)}><UserRoundPlus size={15}/>{ru?"Назначить":"Assign"}</button>
      <RunBulkPopover open={menu==="assign"}><RunBulkPicker kind="assign" workspaceId={workspaceId} ru={ru} paths={paths}
        onChoose={identityId=>{close();void state.submit({kind:"assign",identityId});}}/></RunBulkPopover>
    </div>
    <div className={styles.bulkMenuRoot}>
      <button type="button" className={styles.bulkAction} title={ru?"Переместить":"Move"} aria-label={ru?"Переместить":"Move"}
        aria-haspopup="listbox" aria-expanded={menu==="move"} disabled={locked} onClick={e=>open("move",e)}><FolderInput size={16}/><span>{ru?"Переместить":"Move"}</span></button>
      <RunBulkPopover open={menu==="move"}><RunBulkPicker kind="move" workspaceId={workspaceId} ru={ru} paths={paths}
        onChoose={folderPath=>{close();void state.submit({kind:"move",folderPath:folderPath??"/"});}}/></RunBulkPopover>
    </div>
    <BulkActionMenu id="run-priority" label={ru?"Приоритет":"Priority"} compactLabel={ru?"Приоритет":"Priority"} icon={<Flag size={15}/>}
      open={menu==="priority"} disabled={locked} onToggle={()=>setMenu(menu==="priority"?null:"priority")} onClose={close}
      options={(["low","medium","high","critical"] as const).map(value=>({value,label:localizedLabel(ru?"ru":"en",value),icon:<Flag size={13}/>}))}
      onSelect={priority=>{close();void state.submit({kind:"priority",priority});}}/>
    <button type="button" className={styles.bulkAction} disabled={locked} title={ru?"Убрать из прогона":"Remove from run"}
      aria-label={ru?"Убрать из прогона":"Remove from run"} onClick={()=>void state.submit({kind:"remove"})}><ArrowRight size={16}/><span>{ru?"Убрать из прогона":"Remove from run"}</span></button>
    <button type="button" className={styles.bulkAction} disabled={locked} title={archived?(ru?"Вернуть из архива":"Restore"):(ru?"В архив":"Archive")}
      aria-label={archived?(ru?"Вернуть из архива":"Restore"):(ru?"В архив":"Archive")}
      onClick={()=>void state.submit({kind:archived?"restore":"archive"})}>{archived?<ArchiveRestore size={16}/>:<Archive size={16}/>}<span>{archived?(ru?"Вернуть из архива":"Restore"):(ru?"В архив":"Archive")}</span></button>
    <button type="button" className={styles.bulkClose} disabled={locked} aria-label={ru?"Снять выбор кейсов":"Clear case selection"} onClick={state.toggleSelection}><X size={14}/></button>
  </div></div>,host)}</>;
}
