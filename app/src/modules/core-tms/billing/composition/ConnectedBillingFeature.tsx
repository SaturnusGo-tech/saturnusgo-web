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
import { usePlanRequests } from "../requests/application/usePlanRequests";
import { createPlanRequestApi } from "../requests/data/plan-request-api";
import { usePlanRequestIntent } from "../requests/application/intent/usePlanRequestIntent";
import type { PlanRequest } from "../requests/domain/plan-request";
import { PlanRequestDialog } from "../requests/presentation/PlanRequestDialog";
import { ManualPlanCatalog } from "../requests/presentation/ManualPlanCatalog";
import { planRequestOffers } from "../requests/presentation/offers/plan-request-offers";
import { BillingScreen } from "../presentation/screen/BillingScreen";
import { createAdministrationClient } from "../../company-administration/data/administration-client";
import { BillingIdentityConfirmation } from "../startup/presentation/confirmation/BillingIdentityConfirmation";
import { BillingCheckoutRecovery } from "../startup/presentation/confirmation/BillingCheckoutRecovery";
import { activeStartupWorkspace, completedStartupCheckout } from "../startup/domain/completed-startup";
import { personalAdministrationUrl } from "../../company-administration/navigation/personal-administration-route";
import { TmsAuthState } from "../../auth/presentation/state/TmsAuthState";

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
  const paymentsAvailable = billingPaymentsAvailable || checkoutMode !== "disabled";
  const checkoutResolving = billing.loading && !billing.account && billing.summary?.enabled === true
    && billing.summary.checkoutMode !== "disabled";
  // Plan requests are authorized separately from the controlled checkout.
  const manualAvailable = Boolean(http && (session?.kind === "cloud" || session?.kind === "managed")
    && session.workspaceRole === "workspace_admin" && !isolatedPreview && !paymentsAvailable && !checkoutResolving);
  const manualApi = useMemo(() => manualAvailable && http ? createPlanRequestApi(http, workspaceId) : null, [manualAvailable, http, workspaceId]);
  const { openOffer, setOffer, clearIntent, deepRequestId } = usePlanRequestIntent(workspaceId);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [manualSetupId, setManualSetupId] = useState<string | null>(null);
  const [manualTransitionId, setManualTransitionId] = useState<string | null>(null);
  const manual = usePlanRequests(manualApi, deepRequestId, locale);
  const selectedRequest = manual.data?.requests.find(item => item.id === selectedRequestId)
    ?? (deepRequestId ? manual.request : null);
  const activationRequest = manual.data?.requests.find(item => item.id === manualSetupId)
    ?? (manual.request?.id === manualSetupId ? manual.request : null);
  const transitioningRequest = manual.data?.requests.find(item => item.id === manualTransitionId)
    ?? (deepRequestId ? manual.request : null);
  const manualHandoff = transitioningRequest?.status === "active" && transitioningRequest.planId === "startup"
    && session?.kind === "cloud" && transitioningRequest.companyHostname ? `manual:${transitioningRequest.id}` : null;
  const setupFlowOpen = setupOpen || restoredStartup || recoveryWorkspace === workspaceId || checkoutMode === "controlled_test" && billing.checkout?.status === "open" && billing.checkout.planId === "startup";
  const settledReentry = !setupOpen && !billing.loading && activeStartupWorkspace(billing.summary, billing.account, workspaceId);
  const handoff = useStartupWorkspaceTransition(billing.lastMutation, billing.summary, billing.account, workspaceId, locale, isolatedPreview,
    !billing.loading && (!setupFlowOpen || settledReentry || transitionRequested && activated || Boolean(manualHandoff)),
    transitionRequested || manualHandoff ? "company_admin" : "company_home", manualHandoff);
  useEffect(() => {
    if ((transitionRequested && activated || manualHandoff) && handoff.phase === "complete" && typeof window !== "undefined") {
      window.location.assign(personalAdministrationUrl(window.location.href, workspaceId, "company"));
    }
  }, [transitionRequested, activated, handoff.phase, workspaceId, manualHandoff]);
  const setupApi = useMemo(() => http ? createStartupSetupApi(http, setupLocale) : null, [http, setupLocale]);
  const editAddress = activationRequest?.actions.includes("edit_address") ?? false;
  const manualStartupSetup = manualAvailable && activationRequest?.planId === "startup" && activationRequest.workspaceKind === "personal"
    && (activationRequest.actions.includes("activate") || editAddress);
  const setup = useStartupSetup(setupApi, workspaceId, manualStartupSetup || setupOpen && billing.canManage && billing.summary?.workspaceKind === "personal");
  const ru = locale === "ru";

  function dismissRequest() { clearIntent(); setOffer(null); setSelectedRequestId(null); }
  async function activateRequest(request: PlanRequest) {
    if (request.planId === "startup" && request.workspaceKind === "personal") {
      setSetupLocale(locale);
      setManualSetupId(request.id);
      setSelectedRequestId(request.id);
      return;
    }
    const updated = await manual.act(request, "activate");
    if (!updated) return;
    if (updated.planId === "startup") setManualTransitionId(updated.id);
    billing.reload();
  }
  const pendingRequest = manual.current;
  const manualOffers = manualAvailable && manual.data ? planRequestOffers(manual.data, pendingRequest, ru, (planId, requestId) => {
    clearIntent(); setOffer(planId); setSelectedRequestId(requestId);
  }) : undefined;
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
  if (manualAvailable && !manualSetupId && (transitioningRequest?.status === "activating" && !transitioningRequest.preparationError || handoff.phase === "loading" && manualHandoff)) {
    return <CompanyPreparationScreen ru={ru} preparing name={setup.setup?.displayName} workspace={transitioningRequest ? { name: transitioningRequest.workspaceName, kind: transitioningRequest.workspaceKind } : undefined} />;
  }
  if (manualStartupSetup && activationRequest) {
    return <StartupSetupScreen key={manualSetupId} model={setup} ru={ru} manualAccess canCheckout paymentsAvailable={false} busy={manual.busy}
      onAddressReplaced={editAddress ? () => {
        setManualTransitionId(activationRequest.id);
        setManualSetupId(null);
        manual.reload();
      } : undefined}
      checkoutNotice={manual.failed && <p role="alert">{ru ? "Не удалось начать активацию. Данные компании сохранены." : "Couldn’t start activation. Your company details are saved."}</p>}
      onBack={() => setManualSetupId(null)} onCheckout={async () => {
        if (!setup.setup) return;
        const updated = await manual.act(activationRequest, "activate", { setupId: setup.setup.id, setupVersion: setup.setup.version });
        if (updated) { setManualTransitionId(updated.id); setManualSetupId(null); billing.reload(); }
        else setup.reload();
      }} />;
  }
  if (handoff.phase === "loading" || !setupOpen && setupFlowOpen && billing.loading) return <TmsAuthState kind="loading" />;
  if (handoff.phase === "preparing" || handoff.phase === "opening") return <CompanyPreparationScreen ru={locale === "ru"} preparing={handoff.phase === "preparing"} name={setup.setup?.displayName} />;
  if (setupFlowOpen && !settledReentry) return <StartupSetupScreen key={`${workspaceId}:${setupRevision}`} model={setup} ru={locale === "ru"}
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
  const dialogRequest = selectedRequest ?? (openOffer ? pendingRequest ?? manual.data?.requests.find(item => item.planId === openOffer && item.status === "active") ?? null : null);
  const contactOnly = manual.accessDenied && workspaceKind === "company" && openOffer === "enterprise" && !deepRequestId;
  const offerUnavailable = manual.accessDenied || Boolean(openOffer && manual.data && !manual.data.eligiblePlanIds.includes(openOffer));
  const showManualCatalog = manualAvailable && (Boolean(manualOffers) || !billing.canManage);
  return <>
    <StartupHandoffStatus state={handoff} ru={ru} />
    {showManualCatalog ? <ManualPlanCatalog key={workspaceId} workspaceKind={manual.data?.workspace.kind ?? workspaceKind}
      offers={manualOffers} ru={ru} failed={manual.error} accessDenied={manual.accessDenied} onReload={manual.reload}
      onContact={workspaceKind === "company" ? () => { clearIntent(); setOffer("enterprise"); setSelectedRequestId(null); } : undefined} onClose={onClose} />
      : <BillingScreen key={workspaceId} {...billing} error={checkoutRecovery ? null : billing.error}
        identityConfirmation={checkoutRecovery} ru={ru} paymentsAvailable={paymentsAvailable} checkoutMode={checkoutMode}
        onStartupSetup={openStartupSetup} onClose={onClose} />}
    {manualAvailable && (openOffer || selectedRequestId || deepRequestId) && <PlanRequestDialog planId={dialogRequest?.planId ?? openOffer ?? "individual"} ru={ru}
      data={manual.data} request={dialogRequest} busy={manual.busy} loading={manual.loading || Boolean(deepRequestId && !dialogRequest && !manual.error && !manual.accessDenied)}
      error={manual.error} unavailable={!dialogRequest && offerUnavailable} contactOnly={contactOnly}
      failed={manual.failed} onClose={dismissRequest} onReload={manual.reload}
      onSubmit={async note => {
        if (!openOffer || deepRequestId) return;
        const created = await manual.submit(openOffer, note);
        if (created) setSelectedRequestId(created.id);
      }}
      onActivate={request => void activateRequest(request)} onEditAddress={request => {
        setSetupLocale(locale); setManualSetupId(request.id); setSelectedRequestId(request.id);
      }} onWithdraw={request => void manual.act(request, "withdraw")} />}
  </>;
}
