import type { BillingAccount, BillingIntent, BillingInvoicePage, BillingMutation, BillingSummary } from "./billing";
export interface BillingCommandOptions {
  readonly idempotencyKey: string;
  readonly version?: number;
  readonly signal?: AbortSignal;
}
export interface BillingPort {
  summary(workspaceId: string, signal?: AbortSignal): Promise<BillingSummary>;
  read(workspaceId: string, signal?: AbortSignal): Promise<BillingAccount>;
  invoices(workspaceId: string, options?: { readonly before?: string; readonly beforeId?: string; readonly limit?: number }, signal?: AbortSignal): Promise<BillingInvoicePage>;
  execute(workspaceId: string, intent: BillingIntent, options: BillingCommandOptions): Promise<BillingMutation>;
}
