"use client";
import { billingPaymentsAvailable } from "../domain/catalog/billing-availability";
import { BillingComingSoon } from "./coming-soon/BillingComingSoon";
import { ConnectedBillingFeature } from "./ConnectedBillingFeature";

export function BillingFeature({ workspaceId, preview = false, onClose }: { workspaceId: string; preview?: boolean; onClose?(): void }) {
  return billingPaymentsAvailable ? <ConnectedBillingFeature workspaceId={workspaceId} preview={preview} onClose={onClose} />
    : <BillingComingSoon onClose={onClose} />;
}
