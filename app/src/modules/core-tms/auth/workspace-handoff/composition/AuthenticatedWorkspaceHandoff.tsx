"use client";
import {useEffect,useMemo,type ReactNode} from "react";
import {createTmsHttpClient} from "../../../../../core/tms/transport/http";
import {useTmsLocale} from "../../../localization/context/useTmsLocale";
import {createWorkspaceHandoffApi} from "../data/workspace-handoff-api";
import {navigateWorkspaceHandoff} from "../data/browser-navigation";
import {useWorkspaceHandoff} from "../application/useWorkspaceHandoff";
import {CompanyPreparationScreen} from "../../../billing/startup/presentation/wizard/progress/CompanyPreparationScreen";
import {peekBrowserContinuation,takeBrowserContinuation} from "../../continuation/application/browser-continuation";
import {continuationFromLocation,scopedPlanContinuation,setPlanRequestIntent} from "../../continuation/domain/continuation-path";
import type {WorkspaceHandoffRoute} from "../domain/handoff-policy";
import {TmsAuthState} from "../../presentation/state/TmsAuthState";
import {browserDesktopAttempt} from "../../continuation/desktop/browser-desktop-attempt";
export function AuthenticatedWorkspaceHandoff({workspaceId,children,routeTarget="workspace"}:{workspaceId:string;children?:ReactNode;routeTarget?:WorkspaceHandoffRoute}) {
  const {locale}=useTmsLocale(),origin=typeof window==="undefined"?"":window.location.origin;
  const port=useMemo(()=>origin?createWorkspaceHandoffApi(createTmsHttpClient({apiBase:origin+"/api/v1",credentials:"include"})):null,[origin]);
  const href=typeof window==="undefined"?"":window.location.href;
  const plan=useMemo(()=>{
    if (!href || routeTarget==="company_admin") return null;
    const source=new URL(href);
    const current=continuationFromLocation(source);
    const fromEntry=source.pathname==="/cloud-login/" || source.pathname==="/login/";
    const direct=scopedPlanContinuation(current,origin,workspaceId);
    if (direct || (!fromEntry && routeTarget==="workspace")) return direct;
    return scopedPlanContinuation(peekBrowserContinuation(workspaceId),origin,workspaceId);
  },[href,origin,routeTarget,workspaceId]);
  const targetHref=useMemo(()=>{
    if (!plan) return href;
    const target=new URL(href);
    target.pathname="/work/";
    target.searchParams.set("view","config");
    target.searchParams.set("settings","billing");
    target.searchParams.delete("requestPlan");
    target.searchParams.delete("planRequest");
    setPlanRequestIntent(target.searchParams,plan);
    return target.href;
  },[href,plan]);
  const state=useWorkspaceHandoff({port,workspaceId,completionId:"authenticated:"+workspaceId,locale,routeTarget:plan?"workspace":routeTarget,
    href:targetHref,desktop:typeof navigator!=="undefined"&&/\bFalconDesktop\/[0-9]/.test(navigator.userAgent),readDesktopAttempt:browserDesktopAttempt,navigate:navigateWorkspaceHandoff});
  useEffect(()=>{
    if(children!==undefined&&!plan&&(state.phase==="opening"||state.phase==="preparing"))takeBrowserContinuation(workspaceId);
    if(state.phase==="complete"&&children===undefined)window.location.replace(`/work/?${new URLSearchParams({workspaceId,lang:locale})}`);
  },[state.phase,workspaceId,locale,children,plan]);
  if(state.phase==="complete"&&children!==undefined)return <>{children}</>;
  if(state.phase==="idle"||state.phase==="loading")return <TmsAuthState kind="loading"/>;
  if(state.phase==="preparing"||state.phase==="opening")return <CompanyPreparationScreen ru={locale==="ru"} preparing={state.phase==="preparing"}/>;
  return <div role={state.phase==="error"?"alert":"status"}><p>{state.phase==="error"?(locale==="ru"?"Не удалось открыть пространство. Повторите попытку.":"Could not open this workspace. Try again."):(locale==="ru"?"Открываем пространство…":"Opening your workspace…")}</p>
    {state.phase==="error"&&<button type="button" onClick={state.retry}>{locale==="ru"?"Повторить":"Try again"}</button>}</div>;
}
