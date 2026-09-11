import { useEffect, useRef, useState } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { formatTmsMutationFailure, toTmsMutationFailure } from "../../../../../core/tms/errors/mutation-failure";
import { resolvePendingOperation, type PendingOperation } from "../../../../../core/tms/idempotency/pending-operation";
import type { RunRepositoryEntry } from "../../batches/model/repository/run-repository";
import { assignRunItems, type RunAssignmentRequest } from "../data/run-assignment-api";
export function useRunAssignments(input: { workspaceId:string; scope:string; runId:string; rows:RunRepositoryEntry[];
  ru:boolean; onChanged:()=>void }) {
  const http = useTmsHttpClient(); const [selecting,setSelecting] = useState(false);
  const [selected,setSelected] = useState<Set<string>>(new Set());
  const [assignee,setAssignee] = useState<string|null>(null); const [chosen,setChosen] = useState(false);
  const [busy,setBusy] = useState(false); const [error,setError] = useState("");
  const [owner,setOwner] = useState<string|null|undefined>(undefined);
  const lock = useRef(false); const pending = useRef<PendingOperation|null>(null);
  const prepared = useRef<{ signature:string; body:RunAssignmentRequest }|null>(null);
  const scope = `${input.workspaceId}:${input.scope}`; const latest = useRef(scope); latest.current=scope;
  useEffect(() => { setSelected(new Set()); setSelecting(false); setError(""); setOwner(undefined);
    pending.current=null; prepared.current=null; setChosen(false); },[scope]);
  const toggleScope = (ids:readonly string[]) => setSelected((current) => {
    const next = new Set(current); const remove=ids.every((id) => current.has(id));
    ids.forEach((id) => { if(remove) next.delete(id); else next.add(id); }); return next;
  });
  async function submit() {
    if(lock.current || !selected.size || !chosen) return;
    lock.current=true;setBusy(true);setError("");
    const token=scope;
    try {
      const signature=JSON.stringify({ scope,ids:[...selected].sort(),assignee });
      pending.current=resolvePendingOperation(pending.current,signature);
      if(prepared.current?.signature!==signature) {
        const entries = new Map(input.rows.map((entry) => [entry.item.id,entry]));
        const items=[...selected].map((id) => {
          const entry=entries.get(id);
          if(!entry?.item.rowVersion) throw new Error("Run item must be refreshed");
          return { runId:entry.runId,itemId:id,rowVersion:entry.item.rowVersion };
        });
        prepared.current={ signature,body:{ runId:input.runId,assigneeIdentityId:assignee,items } };
      }
      await assignRunItems(http,input.workspaceId,prepared.current.body,pending.current.key);
      prepared.current=null;pending.current=null;
      if(latest.current===token) { setSelected(new Set());setSelecting(false);input.onChanged(); }
    } catch(err) {
      const failure=toTmsMutationFailure(err);
      if(failure.code && failure.code!=="INTERNAL_ERROR") { prepared.current=null;pending.current=null; }
      if(latest.current===token) {
        setError(formatTmsMutationFailure({ ...failure,message:null }, input.ru
          ? "Не удалось назначить кейсы. Обновите список и повторите. Выбор сохранён."
          : "Could not assign cases. Refresh and retry. Your selection is preserved."));
        input.onChanged();
      }
    } finally { lock.current=false;setBusy(false); }
  }
  return { selecting,selected,assignee,chosen,busy,error,owner,setOwner,submit,toggleScope,
    setAssignee:(id:string|null) => { setAssignee(id);setChosen(true); },
    toggle:(id:string) => toggleScope([id]),
    toggleSelection:() => { if(!busy) { setSelecting(!selecting);setSelected(new Set());setError(""); } },
  };
}
