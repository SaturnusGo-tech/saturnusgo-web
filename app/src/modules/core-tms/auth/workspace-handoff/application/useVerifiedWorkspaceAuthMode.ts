import {useEffect,useMemo,useState} from "react";
import type {CompanySession} from "../../managed/domain/managed-access";
import type {components} from "../../../../../core/tms/generated/tms-api";
type CloudSession=components["schemas"]["CloudAuthenticatedSession"];
type CloudState=components["schemas"]["CloudSessionEnvelope"]["data"];
type Options={read:(signal:AbortSignal)=>Promise<CompanySession>;readCloud?:(signal:AbortSignal)=>Promise<CloudState>;workspaceId:string|null;managedHint:boolean;enabled:boolean};
type Mode="checking"|"managed"|"personal"|"denied"|"error";
export function useVerifiedWorkspaceAuthMode({read,readCloud,workspaceId,managedHint,enabled}:Options) {
  const owner=useMemo(()=>({read,readCloud,workspaceId,managedHint,enabled}),[read,readCloud,workspaceId,managedHint,enabled]);
  const [state,setState]=useState<{owner:object;mode:Mode;cloudSession:CloudSession|null}>({owner,mode:"checking",cloudSession:null}),[revision,reload]=useState(0);
  useEffect(()=>{
    const controller=new AbortController(),commit=(mode:Mode,cloudSession:CloudSession|null=null)=>{if(!controller.signal.aborted)setState({owner,mode,cloudSession});};
    commit("checking");
    if(!enabled)return()=>controller.abort();
    if(!managedHint&&!workspaceId){commit("personal");return()=>controller.abort();}
    void(async()=>{
      let session:CompanySession;
      try{session=await read(controller.signal);}catch(error){if(error&&typeof error==="object"&&"code" in error&&error.code==="SESSION_REQUIRED")session={authenticated:false,stage:"anonymous"};else throw error;}
      if(controller.signal.aborted)return;
      if(session.authenticated){commit(session.audience==="tenant"&&(!workspaceId||session.workspaceId===workspaceId)?"managed":"denied");return;}
      if(session.stage!=="anonymous"){commit(managedHint?"managed":"denied");return;}
      const cloud=readCloud?await readCloud(controller.signal):null;
      if(controller.signal.aborted)return;
      if(cloud?.authenticated){commit(!workspaceId||cloud.workspace.id===workspaceId?"personal":"denied",cloud);return;}
      commit(managedHint?"managed":"personal");
    })().catch(()=>commit("error"));
    return()=>controller.abort();
  },[owner,revision]);
  const current=state.owner===owner?state:{mode:"checking" as Mode,cloudSession:null};
  return {...current,retry:()=>reload(value=>value+1)};
}
