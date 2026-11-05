import { useEffect, useMemo, useRef, useState } from "react";
import type { WorkspaceHandoffNavigation, WorkspaceHandoffPort } from "../domain/handoff-port";
import { workspaceHandoffNavigation } from "../domain/handoff-policy";
type Options={port:WorkspaceHandoffPort|null;completionId:string|null;workspaceId:string;href:string;locale:"en"|"ru";desktop:boolean;navigate(value:WorkspaceHandoffNavigation):void};
type Phase="idle"|"loading"|"opening"|"error"|"complete";
export function useWorkspaceHandoff({port,completionId,workspaceId,href,locale,desktop,navigate}:Options) {
  const owner=useMemo(()=>({port,completionId,workspaceId,href,locale,desktop}),[port,completionId,workspaceId,href,locale,desktop]);
  const [state,setState]=useState<{owner:object;phase:Phase}>({owner,phase:"idle"}),[revision,reload]=useState(0);
  const current=useRef(owner),navigation=useRef(navigate);current.current=owner;navigation.current=navigate;
  useEffect(()=>{
    const controller=new AbortController();
    if(!port||!completionId||!href){setState({owner,phase:"idle"});return()=>controller.abort();}
    setState({owner,phase:"loading"});
    void port.target(workspaceId,controller.signal).then(target=>{
      if(controller.signal.aborted||current.current!==owner)return;
      const destination=workspaceHandoffNavigation(target,workspaceId,href,locale,desktop);
      setState({owner,phase:destination?"opening":"complete"});
      if(destination)navigation.current(destination);
    }).catch(()=>{if(!controller.signal.aborted&&current.current===owner)setState({owner,phase:"error"});});
    return()=>controller.abort();
  },[owner,revision]);
  return {phase:state.owner===owner?state.phase:"idle" as Phase,retry:()=>reload(value=>value+1)};
}
