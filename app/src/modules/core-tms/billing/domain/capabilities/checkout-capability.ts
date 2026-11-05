import type { BillingAccount, BillingCheckoutMode, BillingSummary } from "../billing";

export function billingCheckoutMode(summary: BillingSummary | null, account: BillingAccount | null, localTestingAllowed: boolean): BillingCheckoutMode {
  if (!summary?.enabled || !summary.canManage || !account?.enabled || summary.checkoutMode !== account.checkoutMode) return "disabled";
  if (summary.checkoutMode === "controlled_test") return "controlled_test";
  if (summary.checkoutMode === "local_test" && localTestingAllowed) return "local_test";
  return "disabled";
}
