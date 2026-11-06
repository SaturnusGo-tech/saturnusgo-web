"use client";
import {useEffect,useMemo,useState} from "react";
import {useTmsLocale} from "../../../localization/context/useTmsLocale";
import {createManagedAccessClient} from "../../managed/data/managed-access-client";
import {useManagedAccess} from "../../managed/application/useManagedAccess";
import {ManagedAccessScreen} from "../../managed/presentation/screen/ManagedAccessScreen";
import {AuthContinuation} from "../../continuation/composition/AuthContinuation";
import {AuthenticatedWorkspaceHandoff} from "./AuthenticatedWorkspaceHandoff";
import {readCloudSession} from "../../cloud/cloud-auth-client";
import {TmsAuthState} from "../../presentation/state/TmsAuthState";
export function WorkspaceMfaHandoff({workspaceId}:{workspaceId:string}) {
  const {locale}=useTmsLocale();
  const [proof,setProof]=useState<{workspaceId:string;phase:"checking"|"anonymous"|"verified"|"denied"|"error"}>({workspaceId,phase:"checking"});
  const [revision,retry]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();setProof({workspaceId,phase:"checking"});
    void readCloudSession(controller.signal).then(session=>{
      if(!controller.signal.aborted)setProof({workspaceId,phase:session.authenticated?(session.workspace.id===workspaceId?"verified":"denied"):"anonymous"});
    }).catch(()=>{if(!controller.signal.aborted)setProof({workspaceId,phase:"error"});});
    return()=>controller.abort();
  },[workspaceId,revision]);
  const phase=proof.workspaceId===workspaceId?proof.phase:"checking";
  if(phase==="checking")return <TmsAuthState kind="loading"/>;
  if(phase==="error")return <TmsAuthState kind="error" onAction={()=>retry(value=>value+1)}/>;
  if(phase==="denied")return <p role="alert">{locale==="ru"?"Пространство не соответствует подтверждённому входу.":"This workspace does not match your verified sign-in."}</p>;
  if(phase==="verified")return <AuthContinuation workspaceId={workspaceId}><AuthenticatedWorkspaceHandoff workspaceId={workspaceId}/></AuthContinuation>;
  return <ManagedWorkspaceMfaHandoff workspaceId={workspaceId}/>;
}
export function ManagedWorkspaceMfaHandoff({workspaceId}:{workspaceId:string}) {
  const {locale}=useTmsLocale(),client=useMemo(()=>createManagedAccessClient(),[]),access=useManagedAccess(client);
  const session=access.state.session,ru=locale==="ru";
  if(access.state.loading)return <ManagedAccessScreen access={access}/>;
  if(!session||session.stage==="anonymous")return <div role="alert"><p>{ru?"Войдите снова, чтобы открыть это пространство.":"Sign in again to open this workspace."}</p><a href={`/cloud-login/?lang=${locale}`}>{ru?"Войти":"Sign in"}</a></div>;
  if(!session.authenticated||access.state.recoveryCodes.length>0)return <ManagedAccessScreen access={access}/>;
  if(session.audience!=="tenant"||session.workspaceId!==workspaceId)return <p role="alert">{ru?"Пространство не соответствует подтверждённому входу.":"This workspace does not match your verified sign-in."}</p>;
  return <AuthContinuation workspaceId={workspaceId} managedWorkspace><AuthenticatedWorkspaceHandoff workspaceId={workspaceId}/></AuthContinuation>;
}
