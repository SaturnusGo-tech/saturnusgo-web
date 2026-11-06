import type { BillingAccount,BillingMutation,BillingSummary } from "../../domain/billing";
export function activeStartupWorkspace(summary:BillingSummary|null,account:BillingAccount|null,workspaceId:string):boolean {
  return summary?.workspaceKind==="company"&&summary.planId==="startup"&&summary.status==="active"&&summary.teamAdministration===true
    &&account?.subscription?.workspaceId===workspaceId&&account.subscription.planId==="startup"&&account.subscription.status==="active";
}
export function completedStartupCheckout(receipt:BillingMutation|null,summary:BillingSummary|null,workspaceId:string):string|null {
  const checkout=receipt?.checkout,subscription=receipt?.subscription;
  return checkout?.status==="completed"&&checkout.planId==="startup"&&checkout.workspaceId===workspaceId
    &&subscription?.planId==="startup"&&subscription.status==="active"&&subscription.workspaceId===workspaceId
    &&summary?.workspaceKind==="company"&&summary.planId==="startup"&&summary.status==="active"?checkout.id:null;
}
