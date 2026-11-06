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
import { billingCheckoutMode } from "../domain/capabilities/checkout-capability";
import { useStartupWorkspaceTransition } from "../startup/composition/useStartupWorkspaceTransition";
import { StartupHandoffStatus } from "../startup/presentation/StartupHandoffStatus";
import { BillingScreen } from "../presentation/screen/BillingScreen";
import { createAdministrationClient } from "../../company-administration/data/administration-client";
import { BillingIdentityConfirmation } from "../startup/presentation/confirmation/BillingIdentityConfirmation";
import { completedStartupCheckout } from "../startup/domain/completed-startup";
import { personalAdministrationUrl } from "../../company-administration/navigation/personal-administration-route";

export function ConnectedBillingFeature({ workspaceId, preview = false, onClose }: { workspaceId: string; preview?: boolean; onClose?(): void }) {
  const http = useOptionalTmsHttpClient();
  const session = useOptionalTmsSession();
  const { locale } = useTmsLocale();
  const isolatedPreview = process.env.NODE_ENV !== "production" && preview && session?.subject === "preview:mercury";
  const workspaceKind = session?.workspaceKind ?? "company";
  const port = useMemo(() => isolatedPreview ? createPreviewBillingPort(workspaceKind, workspaceId) : http ? createBillingApi(http) : null,
    [http, isolatedPreview, workspaceId, workspaceKind]);
  const billing = useBilling({ port, workspaceId: session ? workspaceId : null, workspaceKind,
    reauthenticationScope: session?.subject ?? undefined,
    canManage: isolatedPreview || session?.workspaceRole === "workspace_admin" });
  const confirmationClient = useMemo(() => http ? createAdministrationClient(http) : null, [http]);
  const [setupOpen, setSetupOpen] = useState(false);
  const handoff = useStartupWorkspaceTransition(billing.lastMutation, billing.summary, workspaceId, locale, isolatedPreview, !setupOpen);
  const setupApi = useMemo(() => http ? createStartupSetupApi(http) : null, [http]);
  const setup = useStartupSetup(setupApi, workspaceId, setupOpen && billing.canManage && billing.summary?.workspaceKind === "personal");
  const checkoutMode = billingCheckoutMode(billing.summary, billing.account, process.env.NODE_ENV !== "production");
  const paymentsAvailable = billingPaymentsAvailable || checkoutMode !== "disabled";
  const activated = completedStartupCheckout(billing.lastMutation, billing.summary, workspaceId) !== null;
  const activationPending = !activated && billing.checkout?.status === "completed" && billing.checkout.planId === "startup" && billing.checkout.workspaceId === workspaceId;
  const identityConfirmation = billing.error?.code === "REAUTHENTICATION_REQUIRED" && session && <BillingIdentityConfirmation
    managed={session.kind === "managed"} client={confirmationClient} signOut={session.signOut}
    retry={async () => { if (paymentsAvailable) await billing.retryCommand(); }} busy={billing.busy || !paymentsAvailable} ru={locale === "ru"} />;
  const checkoutNotice = identityConfirmation || (billing.error && <div role="alert">
    <p>{locale === "ru" ? "Не удалось начать или подтвердить оплату. Данные компании сохранены." : "Could not start or confirm checkout. Your company setup is saved."}</p>
    <button type="button" disabled={billing.busy || (billing.canRetryCommand && !paymentsAvailable)} onClick={() => {
      if (billing.canRetryCommand) { if (paymentsAvailable) void billing.retryCommand(); } else billing.reload();
    }}>{billing.canRetryCommand ? (locale === "ru" ? "Повторить то же действие" : "Retry the same action") : (locale === "ru" ? "Обновить данные" : "Refresh details")}</button>
  </div>);
  if (setupOpen) return <StartupSetupScreen key={workspaceId} model={setup} ru={locale === "ru"}
    plan={billing.account?.plans.find(plan => plan.id === "startup")} quote={billing.account?.checkoutQuotes.find(quote => quote.planId === "startup")}
    canCheckout={!!billing.account?.allowedCheckoutPlanIds.includes("startup")} paymentsAvailable={paymentsAvailable} busy={billing.busy || billing.canRetryCommand}
    checkoutNotice={checkoutNotice} controlledTest={checkoutMode === "controlled_test"}
    checkout={billing.checkout?.planId === "startup" ? billing.checkout : null} activated={activated} activationPending={activationPending}
    onRefreshBilling={billing.reload} onConfirmCheckout={async outcome => {
      if (paymentsAvailable && billing.checkout?.planId === "startup") await billing.confirmCheckout(outcome);
    }} onContinue={() => {
      if (activated && billing.canManage && billing.summary?.teamAdministration && !billing.busy && !billing.canRetryCommand && typeof window !== "undefined") {
        window.location.assign(session?.administrationPath ?? personalAdministrationUrl(window.location.href, workspaceId, "company"));
      }
    }}
    onBack={() => setSetupOpen(false)} onCheckout={async () => {
      if (paymentsAvailable && setup.setup?.status === "ready") await billing.startCheckout("startup", { startupSetupId: setup.setup.id, startupSetupVersion: setup.setup.version, confirmWorkspaceConversion: true });
    }} />;
  return <><StartupHandoffStatus state={handoff} ru={locale === "ru"} /><BillingScreen key={workspaceId} {...billing} error={identityConfirmation ? null : billing.error} identityConfirmation={identityConfirmation} ru={locale === "ru"} paymentsAvailable={paymentsAvailable} checkoutMode={checkoutMode} onStartupSetup={() => setSetupOpen(true)} onClose={onClose} /></>;
}
