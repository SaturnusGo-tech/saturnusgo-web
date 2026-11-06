"use client";
import { useEffect, useMemo, useState } from "react";
import { useOptionalTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { useOptionalTmsSession } from "../../auth/presentation/session/TmsSessionContext";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { useBilling } from "../application/useBilling";
import { createBillingApi } from "../data/http/billing-api";
import { createPreviewBillingPort } from "../data/preview/preview-billing";
import { useStartupSetup } from "../startup/application/useStartupSetup";
import { useStartupCheckoutRecovery } from "../startup/application/useStartupCheckoutRecovery";
import { createStartupSetupApi } from "../startup/data/startup-setup-api";
import { StartupSetupScreen } from "../startup/presentation/StartupSetupScreen";
import { CompanyPreparationScreen } from "../startup/presentation/wizard/progress/CompanyPreparationScreen";
import { billingPaymentsAvailable } from "../domain/catalog/billing-availability";
import { billingCheckoutMode } from "../domain/capabilities/checkout-capability";
import { useStartupWorkspaceTransition } from "../startup/composition/useStartupWorkspaceTransition";
import { StartupHandoffStatus } from "../startup/presentation/StartupHandoffStatus";
import { BillingScreen } from "../presentation/screen/BillingScreen";
import { createAdministrationClient } from "../../company-administration/data/administration-client";
import { BillingIdentityConfirmation } from "../startup/presentation/confirmation/BillingIdentityConfirmation";
import { BillingCheckoutRecovery } from "../startup/presentation/confirmation/BillingCheckoutRecovery";
import { activeStartupWorkspace, completedStartupCheckout } from "../startup/domain/completed-startup";
import { personalAdministrationUrl } from "../../company-administration/navigation/personal-administration-route";

export function ConnectedBillingFeature({ workspaceId, preview = false, onClose }: { workspaceId: string; preview?: boolean; onClose?(): void }) {
  const http = useOptionalTmsHttpClient();
  const session = useOptionalTmsSession();
  const { locale } = useTmsLocale();
  const isolatedPreview = process.env.NODE_ENV !== "production" && preview && session?.subject === "preview:mercury";
  const workspaceKind = session?.workspaceKind ?? "company";
  const livePort = useMemo(() => http ? createBillingApi(http) : null, [http]);
  const previewPort = useMemo(() => isolatedPreview ? createPreviewBillingPort(workspaceKind, workspaceId) : null, [isolatedPreview, workspaceId, workspaceKind]);
  const port = isolatedPreview ? previewPort : livePort;
  const billing = useBilling({ port, workspaceId: session ? workspaceId : null, workspaceKind,
    reauthenticationScope: session?.subject ?? undefined,
    canManage: isolatedPreview || session?.workspaceRole === "workspace_admin" });
  const confirmationClient = useMemo(() => http ? createAdministrationClient(http) : null, [http]);
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupLocale, setSetupLocale] = useState(locale);
  const [recoveryWorkspace, setRecoveryWorkspace] = useState<string | null>(null);
  const [setupRevision, setSetupRevision] = useState(0);
  const [supersededCheckoutId, setSupersededCheckoutId] = useState<string | null>(null);
  const [transitionWorkspace, setTransitionWorkspace] = useState<string | null>(null);
  const activated = completedStartupCheckout(billing.lastMutation, billing.summary, workspaceId) !== null;
  const transitionRequested = transitionWorkspace === workspaceId || activated && billing.canManage && billing.summary?.teamAdministration === true && billing.lastMutation?.checkoutMode === "controlled_test";
  const restoredStartup = !!billing.pendingCommand && (billing.pendingCommand.intent.kind === "confirm" || billing.pendingCommand.intent.kind === "checkout" && billing.pendingCommand.intent.planId === "startup");
  useEffect(() => { if (restoredStartup) setRecoveryWorkspace(workspaceId); }, [restoredStartup, workspaceId]);
  const checkoutMode = billingCheckoutMode(billing.summary, billing.account, process.env.NODE_ENV !== "production");
  const setupFlowOpen = setupOpen || restoredStartup || recoveryWorkspace === workspaceId || checkoutMode === "controlled_test" && billing.checkout?.status === "open" && billing.checkout.planId === "startup";
  const settledReentry = !setupOpen && !billing.loading && activeStartupWorkspace(billing.summary, billing.account, workspaceId);
  const handoff = useStartupWorkspaceTransition(billing.lastMutation, billing.summary, billing.account, workspaceId, locale, isolatedPreview,
    !billing.loading && (!setupFlowOpen || settledReentry || transitionRequested && activated), transitionRequested ? "company_admin" : "company_home");
  useEffect(() => {
    if (transitionRequested && activated && handoff.phase === "complete" && typeof window !== "undefined") {
      window.location.assign(personalAdministrationUrl(window.location.href, workspaceId, "company"));
    }
  }, [transitionRequested, activated, handoff.phase, workspaceId]);
  const setupApi = useMemo(() => http ? createStartupSetupApi(http, setupLocale) : null, [http, setupLocale]);
  const setup = useStartupSetup(setupApi, workspaceId, setupOpen && billing.canManage && billing.summary?.workspaceKind === "personal");
  const paymentsAvailable = billingPaymentsAvailable || checkoutMode !== "disabled";
  const recovery = useStartupCheckoutRecovery({ port: setupApi, workspaceId, command: billing.pendingCommand, checkout: billing.checkout,
    enabled: !!billing.pendingCommand && !billing.loading && billing.canManage && paymentsAvailable && billing.summary?.workspaceKind === "personal"
      && (billing.pendingCommand.intent.kind === "confirm" || !!billing.summary.allowedCheckoutPlanIds?.includes("startup") && !!billing.account?.allowedCheckoutPlanIds?.includes("startup")), resume: billing.retryCommand });
  const activationPending = !activated && billing.checkout?.status === "completed" && billing.checkout.planId === "startup" && billing.checkout.workspaceId === workspaceId;
  const identityConfirmation = billing.error?.code === "REAUTHENTICATION_REQUIRED" && session && <BillingIdentityConfirmation
    managed={session.kind === "managed"} client={confirmationClient} signOut={session.signOut}
    retry={async () => { if (paymentsAvailable) await billing.retryCommand(); }} busy={billing.busy} ru={locale === "ru"} fullscreen={setupFlowOpen} />;
  const preparationRequired = billing.error?.code === "BILLING_STARTUP_SETUP_REQUIRED";
  const pendingAction = billing.error?.code === "BILLING_ACTION_PENDING";
  function openStartupSetup() { setSetupLocale(locale); setSetupOpen(true); }
  function prepareCompanyAgain() {
    if (!billing.canManage || billing.summary?.workspaceKind !== "personal" || billing.busy || billing.canRetryCommand || setup.busy || setup.canRetryCommand) return;
    billing.dismissError();
    setSupersededCheckoutId(billing.checkout?.id ?? null);
    setup.reload();
    setSetupRevision(value => value + 1);
    openStartupSetup();
  }
  const checkoutRecovery = identityConfirmation || ((preparationRequired || pendingAction) && <BillingCheckoutRecovery
    preparationRequired={preparationRequired} checking={recovery.checking} ru={locale === "ru"}
    busy={billing.busy || !billing.canManage || (preparationRequired ? billing.canRetryCommand || setup.busy || setup.canRetryCommand || billing.summary?.workspaceKind !== "personal" : !paymentsAvailable || !billing.canRetryCommand)}
    onContinue={preparationRequired ? prepareCompanyAgain : async () => { if (paymentsAvailable) await billing.retryCommand(); }} />);
  const checkoutNotice = checkoutRecovery || (billing.error && <div role="alert">
    <p>{locale === "ru" ? "Не удалось начать или подтвердить оплату. Данные компании сохранены." : "Could not start or confirm checkout. Your company setup is saved."}</p>
    <button type="button" disabled={billing.busy || (billing.canRetryCommand && !paymentsAvailable)} onClick={() => {
      if (billing.canRetryCommand) { if (paymentsAvailable) void billing.retryCommand(); } else billing.reload();
    }}>{billing.canRetryCommand ? (locale === "ru" ? "Повторить то же действие" : "Retry the same action") : (locale === "ru" ? "Обновить данные" : "Refresh details")}</button>
  </div>);
  if (handoff.phase === "preparing" || handoff.phase === "loading" || handoff.phase === "opening") return <CompanyPreparationScreen ru={locale === "ru"} preparing={handoff.phase === "preparing"} name={setup.setup?.displayName} />;
  if (setupFlowOpen) return <StartupSetupScreen key={`${workspaceId}:${setupRevision}`} model={setup} ru={locale === "ru"}
    plan={billing.account?.plans.find(plan => plan.id === "startup")} quote={billing.account?.checkoutQuotes.find(quote => quote.planId === "startup")}
    canCheckout={!!billing.account?.allowedCheckoutPlanIds.includes("startup")} paymentsAvailable={paymentsAvailable} busy={billing.busy || billing.canRetryCommand}
    checkoutNotice={transitionRequested ? handoff.phase === "error" && <StartupHandoffStatus state={handoff} ru={locale === "ru"} /> : checkoutNotice}
    transitionPending={transitionRequested} recoveryPending={!setupOpen} identityConfirmation={identityConfirmation} controlledTest={checkoutMode === "controlled_test"} localTest={checkoutMode === "local_test"}
    checkout={billing.checkout?.planId === "startup" && billing.checkout.id !== supersededCheckoutId ? billing.checkout : null} activated={activated} activationPending={activationPending}
    onRefreshBilling={billing.reload} onConfirmCheckout={async outcome => {
      if (paymentsAvailable && checkoutMode !== "controlled_test" && billing.checkout?.planId === "startup") await billing.confirmCheckout(outcome);
    }} onContinue={() => {
      if (activated && billing.canManage && billing.summary?.teamAdministration && !billing.busy && !billing.canRetryCommand && typeof window !== "undefined") {
        setTransitionWorkspace(workspaceId);
      }
    }}
    onBack={() => { setSetupOpen(false); setRecoveryWorkspace(null); }} onCheckout={async () => {
      if (paymentsAvailable && setup.setup?.status === "ready") await billing.startCheckout("startup", { startupSetupId: setup.setup.id, startupSetupVersion: setup.setup.version, confirmWorkspaceConversion: true });
    }} />;
  return <><StartupHandoffStatus state={handoff} ru={locale === "ru"} /><BillingScreen key={workspaceId} {...billing} error={checkoutRecovery ? null : billing.error} identityConfirmation={checkoutRecovery} ru={locale === "ru"} paymentsAvailable={paymentsAvailable} checkoutMode={checkoutMode} onStartupSetup={openStartupSetup} onClose={onClose} /></>;
}
