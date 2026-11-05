"use client";
import { useMemo, useState } from "react";
import { useOptionalTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { useOptionalTmsSession } from "../../auth/presentation/session/TmsSessionContext";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { useBilling } from "../application/useBilling";
import { createBillingApi } from "../data/http/billing-api";
import { createPreviewBillingPort } from "../data/preview/preview-billing";
import { useStartupSetup } from "../startup/application/useStartupSetup";
import { createStartupSetupApi } from "../startup/data/startup-setup-api";
import { StartupSetupScreen } from "../startup/presentation/StartupSetupScreen";
import { billingPaymentsAvailable } from "../domain/catalog/billing-availability";
import { BillingScreen } from "../presentation/screen/BillingScreen";

export function ConnectedBillingFeature({ workspaceId, preview = false, onClose }: { workspaceId: string; preview?: boolean; onClose?(): void }) {
  const http = useOptionalTmsHttpClient();
  const session = useOptionalTmsSession();
  const { locale } = useTmsLocale();
  const isolatedPreview = process.env.NODE_ENV !== "production" && preview && session?.subject === "preview:mercury";
  const workspaceKind = session?.workspaceKind ?? "company";
  const port = useMemo(() => isolatedPreview ? createPreviewBillingPort(workspaceKind, workspaceId) : http ? createBillingApi(http) : null,
    [http, isolatedPreview, workspaceId, workspaceKind]);
  const billing = useBilling({ port, workspaceId: session ? workspaceId : null, workspaceKind,
    canManage: isolatedPreview || session?.workspaceRole === "workspace_admin" });
  const [setupOpen, setSetupOpen] = useState(false);
  const setupApi = useMemo(() => http ? createStartupSetupApi(http) : null, [http]);
  const setup = useStartupSetup(setupApi, workspaceId, setupOpen && billing.canManage && billing.summary?.workspaceKind === "personal");
  const paymentsAvailable = billingPaymentsAvailable || (process.env.NODE_ENV !== "production" && billing.account?.testMode === true);
  if (setupOpen && billing.summary?.workspaceKind === "personal" && billing.checkout?.status !== "open") return <StartupSetupScreen key={workspaceId} model={setup} ru={locale === "ru"}
    plan={billing.account?.plans.find(plan => plan.id === "startup")} quote={billing.account?.checkoutQuotes.find(quote => quote.planId === "startup")}
    canCheckout={!!billing.account?.allowedCheckoutPlanIds.includes("startup")} paymentsAvailable={paymentsAvailable} busy={billing.busy}
    onBack={() => setSetupOpen(false)} onCheckout={async () => {
      if (paymentsAvailable && setup.setup?.status === "ready") await billing.startCheckout("startup", { startupSetupId: setup.setup.id, startupSetupVersion: setup.setup.version, confirmWorkspaceConversion: true });
    }} />;
  return <BillingScreen key={workspaceId} {...billing} ru={locale === "ru"} paymentsAvailable={paymentsAvailable} onStartupSetup={() => setSetupOpen(true)} onClose={onClose} />;
}
