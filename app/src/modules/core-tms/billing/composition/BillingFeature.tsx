"use client";
import { ConnectedBillingFeature } from "./ConnectedBillingFeature";
export function BillingFeature({ workspaceId, preview = false, onClose }: { workspaceId: string; preview?: boolean; onClose?(): void }) {
  return <ConnectedBillingFeature key={workspaceId} workspaceId={workspaceId} preview={preview} onClose={onClose} />;
}
