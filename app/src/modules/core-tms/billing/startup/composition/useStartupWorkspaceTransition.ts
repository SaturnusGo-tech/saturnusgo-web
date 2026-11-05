import { useMemo } from "react";
import { useOptionalTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useWorkspaceHandoff } from "../../../auth/workspace-handoff/application/useWorkspaceHandoff";
import { createWorkspaceHandoffApi } from "../../../auth/workspace-handoff/data/workspace-handoff-api";
import { navigateWorkspaceHandoff } from "../../../auth/workspace-handoff/data/browser-navigation";
import type { BillingMutation,BillingSummary } from "../../domain/billing";
import { completedStartupCheckout } from "../domain/completed-startup";
export function useStartupWorkspaceTransition(receipt:BillingMutation|null,summary:BillingSummary|null,workspaceId:string,locale:"en"|"ru",preview=false) {
  const http=useOptionalTmsHttpClient();
  const port=useMemo(()=>http?createWorkspaceHandoffApi(http):null,[http]);
  return useWorkspaceHandoff({port,workspaceId,completionId:preview?null:completedStartupCheckout(receipt,summary,workspaceId),locale,
    href:typeof window==="undefined"?"":window.location.href,desktop:typeof navigator!=="undefined"&&/\bFalconDesktop\/[0-9]/.test(navigator.userAgent),navigate:navigateWorkspaceHandoff});
}
