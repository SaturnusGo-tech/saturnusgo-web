import type { BillingMutation,BillingSummary } from "../../domain/billing";
export function completedStartupCheckout(receipt:BillingMutation|null,summary:BillingSummary|null,workspaceId:string):string|null {
  const checkout=receipt?.checkout,subscription=receipt?.subscription;
  return checkout?.status==="completed"&&checkout.planId==="startup"&&checkout.workspaceId===workspaceId
    &&subscription?.planId==="startup"&&subscription.status==="active"&&subscription.workspaceId===workspaceId
    &&summary?.workspaceKind==="company"&&summary.planId==="startup"&&summary.status==="active"?checkout.id:null;
}
