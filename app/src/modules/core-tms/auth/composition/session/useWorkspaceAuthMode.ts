import {useEffect,useMemo,useState} from "react";
import {readCloudSession} from "../../cloud/cloud-auth-client";
import {createManagedAccessClient} from "../../managed/data/managed-access-client";
import {useVerifiedWorkspaceAuthMode} from "../../workspace-handoff/application/useVerifiedWorkspaceAuthMode";
export function useWorkspaceAuthMode() {
  const client=useMemo(()=>createManagedAccessClient(),[]);
  const [context,setContext]=useState<{workspaceId:string|null;managedHint:boolean}|null>(null);
  useEffect(()=>{
    const query=new URLSearchParams(window.location.search),ids=query.getAll("workspaceId");
    setContext({workspaceId:ids.length===1&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(ids[0])?ids[0]:null,
      managedHint:document.querySelector('meta[name="falcon-access"]')?.getAttribute("content")==="managed"||(process.env.NODE_ENV!=="production"&&process.env.NEXT_PUBLIC_FALCON_MANAGED_AUTH==="true")});
  },[]);
  return useVerifiedWorkspaceAuthMode({read:client.session,readCloud:readCloudSession,workspaceId:context?.workspaceId??null,managedHint:context?.managedHint??false,enabled:!!context});
}
