import { useMemo } from "react";
import { useOptionalTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useWorkspaceHandoff } from "../../../auth/workspace-handoff/application/useWorkspaceHandoff";
import { createWorkspaceHandoffApi } from "../../../auth/workspace-handoff/data/workspace-handoff-api";
import { navigateWorkspaceHandoff } from "../../../auth/workspace-handoff/data/browser-navigation";
import type { WorkspaceHandoffRoute } from "../../../auth/workspace-handoff/domain/handoff-policy";
import type { BillingAccount,BillingMutation,BillingSummary } from "../../domain/billing";
import { activeStartupWorkspace,completedStartupCheckout } from "../domain/completed-startup";
export function useStartupWorkspaceTransition(receipt:BillingMutation|null,summary:BillingSummary|null,account:BillingAccount|null,workspaceId:string,locale:"en"|"ru",preview=false,enabled=true,routeTarget:WorkspaceHandoffRoute="workspace",manualCompletionId:string|null=null) {
  const http=useOptionalTmsHttpClient();
  const port=useMemo(()=>http?createWorkspaceHandoffApi(http):null,[http]);
  const completionId=manualCompletionId??completedStartupCheckout(receipt,summary,workspaceId)??(activeStartupWorkspace(summary,account,workspaceId)?`active:${account!.subscription!.id}:${account!.subscription!.version}`:null);
  return useWorkspaceHandoff({port,workspaceId,completionId:preview||!enabled?null:completionId,locale,routeTarget,
    href:typeof window==="undefined"?"":window.location.href,desktop:typeof navigator!=="undefined"&&/\bFalconDesktop\/[0-9]/.test(navigator.userAgent),navigate:navigateWorkspaceHandoff});
}
