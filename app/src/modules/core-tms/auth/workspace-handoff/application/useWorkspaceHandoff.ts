import { useEffect, useMemo, useRef, useState } from "react";
import type { WorkspaceHandoffNavigation, WorkspaceHandoffPort } from "../domain/handoff-port";
import { workspaceHandoffNavigation, type WorkspaceHandoffRoute } from "../domain/handoff-policy";
type Options={port:WorkspaceHandoffPort|null;completionId:string|null;workspaceId:string;href:string;locale:"en"|"ru";desktop:boolean;routeTarget?:WorkspaceHandoffRoute;readDesktopAttempt?():string|undefined;navigate(value:WorkspaceHandoffNavigation):void};
type Phase="idle"|"loading"|"opening"|"preparing"|"error"|"complete";
export function useWorkspaceHandoff({port,completionId,workspaceId,href,locale,desktop,routeTarget="workspace",readDesktopAttempt,navigate}:Options) {
  const owner=useMemo(()=>({port,completionId,workspaceId,href,locale,desktop,routeTarget,readDesktopAttempt}),[port,completionId,workspaceId,href,locale,desktop,routeTarget,readDesktopAttempt]);
  const [state,setState]=useState<{owner:object;phase:Phase}>({owner,phase:"idle"}),[revision,reload]=useState(0);
  const current=useRef(owner),navigation=useRef(navigate);current.current=owner;navigation.current=navigate;
  useEffect(()=>{
    const controller=new AbortController();
    if(!port||!completionId||!href){setState({owner,phase:"idle"});return()=>controller.abort();}
    setState(value=>value.owner===owner&&value.phase==="preparing"?value:{owner,phase:"loading"});
    void port.target(workspaceId,controller.signal).then(target=>{
      if(controller.signal.aborted||current.current!==owner)return;
      const destination=workspaceHandoffNavigation(target,workspaceId,href,locale,desktop,routeTarget,readDesktopAttempt?.());
      setState({owner,phase:destination?"opening":"complete"});
      if(destination)navigation.current(destination);
    }).catch(error=>{if(!controller.signal.aborted&&current.current===owner)setState({owner,
      phase:error&&typeof error==="object"&&error.code==="HANDOFF_TARGET_PREPARING"?"preparing":"error"});});
    return()=>controller.abort();
  },[owner,revision]);
  useEffect(()=>{
    if(state.owner!==owner||state.phase!=="preparing")return;
    const timer=setTimeout(()=>reload(value=>value+1),2500);
    return()=>clearTimeout(timer);
  },[owner,state]);
  return {phase:state.owner===owner?state.phase:"idle" as Phase,retry:()=>reload(value=>value+1)};
}
