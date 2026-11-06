"use client";
import {useEffect,useMemo} from "react";
import {createTmsHttpClient} from "../../../../../core/tms/transport/http";
import {useTmsLocale} from "../../../localization/context/useTmsLocale";
import {createWorkspaceHandoffApi} from "../data/workspace-handoff-api";
import {navigateWorkspaceHandoff} from "../data/browser-navigation";
import {useWorkspaceHandoff} from "../application/useWorkspaceHandoff";
import {CompanyPreparationScreen} from "../../../billing/startup/presentation/wizard/progress/CompanyPreparationScreen";
export function AuthenticatedWorkspaceHandoff({workspaceId}:{workspaceId:string}) {
  const {locale}=useTmsLocale(),origin=typeof window==="undefined"?"":window.location.origin;
  const port=useMemo(()=>origin?createWorkspaceHandoffApi(createTmsHttpClient({apiBase:origin+"/api/v1",credentials:"include"})):null,[origin]);
  const state=useWorkspaceHandoff({port,workspaceId,completionId:"authenticated:"+workspaceId,locale,
    href:typeof window==="undefined"?"":window.location.href,desktop:typeof navigator!=="undefined"&&/\bFalconDesktop\/[0-9]/.test(navigator.userAgent),navigate:navigateWorkspaceHandoff});
  useEffect(()=>{if(state.phase==="complete")window.location.replace(`/testcases/umbrella-home/work/?${new URLSearchParams({workspaceId,lang:locale})}`);},[state.phase,workspaceId,locale]);
  if(state.phase==="preparing"||state.phase==="loading"||state.phase==="opening")return <CompanyPreparationScreen ru={locale==="ru"} preparing={state.phase==="preparing"}/>;
  return <div role={state.phase==="error"?"alert":"status"}><p>{state.phase==="error"?(locale==="ru"?"Не удалось открыть пространство. Повторите попытку.":"Could not open this workspace. Try again."):(locale==="ru"?"Открываем пространство…":"Opening your workspace…")}</p>
    {state.phase==="error"&&<button type="button" onClick={state.retry}>{locale==="ru"?"Повторить":"Try again"}</button>}</div>;
}
