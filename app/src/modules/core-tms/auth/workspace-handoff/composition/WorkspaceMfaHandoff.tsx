"use client";
import {useMemo} from "react";
import {useTmsLocale} from "../../../localization/context/useTmsLocale";
import {createManagedAccessClient} from "../../managed/data/managed-access-client";
import {useManagedAccess} from "../../managed/application/useManagedAccess";
import {ManagedAccessScreen} from "../../managed/presentation/screen/ManagedAccessScreen";
import {AuthContinuation} from "../../continuation/composition/AuthContinuation";
import {AuthenticatedWorkspaceHandoff} from "./AuthenticatedWorkspaceHandoff";
export function WorkspaceMfaHandoff({workspaceId}:{workspaceId:string}) {
  const {locale}=useTmsLocale(),client=useMemo(()=>createManagedAccessClient(),[]),access=useManagedAccess(client);
  const session=access.state.session,ru=locale==="ru";
  if(access.state.loading)return <ManagedAccessScreen access={access}/>;
  if(!session||session.stage==="anonymous")return <div role="alert"><p>{ru?"Войдите снова, чтобы открыть это пространство.":"Sign in again to open this workspace."}</p><a href={`/cloud-login/?lang=${locale}`}>{ru?"Войти":"Sign in"}</a></div>;
  if(!session.authenticated||access.state.recoveryCodes.length>0)return <ManagedAccessScreen access={access}/>;
  if(session.audience!=="tenant"||session.workspaceId!==workspaceId)return <p role="alert">{ru?"Пространство не соответствует подтверждённому входу.":"This workspace does not match your verified sign-in."}</p>;
  return <AuthContinuation workspaceId={workspaceId} managedWorkspace><AuthenticatedWorkspaceHandoff workspaceId={workspaceId}/></AuthContinuation>;
}
