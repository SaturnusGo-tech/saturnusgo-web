import { useEffect, type ReactNode } from "react";
import type { useStartupSetup } from "../application/useStartupSetup";
import type { BillingPlan, BillingAccount, BillingCheckout, BillingOutcome } from "../../domain/billing";
import { useCompanyWizard } from "./wizard/model/useCompanyWizard";
import { CompanyWizardFrame } from "./wizard/frame/CompanyWizardFrame";
import { CompanyIdentityStep } from "./wizard/identity/CompanyIdentityStep";
import { CompanyLegalStep } from "./wizard/legal/CompanyLegalStep";
import { CompanyConsentStep } from "./wizard/consent/CompanyConsentStep";
import { CompanyCheckoutStep } from "./wizard/checkout/CompanyCheckoutStep";
import { CompanyProgressStep } from "./wizard/progress/CompanyProgressStep";
import css from "./startup.module.css";
type Props = { model: ReturnType<typeof useStartupSetup>; plan?: BillingPlan; quote?: BillingAccount["checkoutQuotes"][number];
  canCheckout: boolean; paymentsAvailable: boolean; busy: boolean; ru: boolean; controlledTest?: boolean; localTest?: boolean; checkoutNotice?: ReactNode; identityConfirmation?: ReactNode;
  checkout?: BillingCheckout | null; activated?: boolean; activationPending?: boolean; transitionPending?: boolean; recoveryPending?: boolean; onConfirmCheckout?(outcome: BillingOutcome): Promise<void>;
  onContinue?(): void; onRefreshBilling?(): void; onBack(): void; onCheckout(): Promise<void> };
export function StartupSetupScreen({ model, plan, quote, canCheckout, paymentsAvailable, busy, ru, controlledTest = false, localTest = false, checkoutNotice, identityConfirmation,
  checkout, activated = false, activationPending = false, transitionPending = false, recoveryPending = false, onConfirmCheckout, onContinue, onRefreshBilling, onBack, onCheckout }: Props) {
  const wizard = useCompanyWizard(model);
  const locked = busy || wizard.locked;
  const setup = model.setup;
  const ready = setup?.status === "ready" && !wizard.changed;
  const awaitingCheckout = controlledTest && checkout?.status === "open";
  const stage = identityConfirmation ? "identity" : transitionPending ? "opening" : activated ? "success" : recoveryPending || activationPending || awaitingCheckout || (busy && checkout?.status === "open") ? "finishing" : checkout?.status === "open" ? "checkout" : model.loading && !wizard.snapshot ? "loading" : wizard.stage;
  useEffect(() => {
    if ((!activationPending && !awaitingCheckout) || busy || checkoutNotice || !onRefreshBilling) return;
    const timer = setTimeout(onRefreshBilling, 2500);
    return () => clearTimeout(timer);
  }, [activationPending, awaitingCheckout, busy, checkoutNotice, onRefreshBilling]);
  const error = model.error?.code;
  const fieldError = error && /SLUG|ADDRESS|HOSTNAME|DISPLAY_NAME/.test(error) ? (ru ? "Проверьте значение или выберите другой вариант." : "Check this value or choose another one.") : undefined;
  function checkoutAction() {
    if (locked || !wizard.consented || !canCheckout || !paymentsAvailable || !quote || !plan) return;
    if (!ready) { wizard.go("preparing"); return; }
    void onCheckout();
  }
  async function retryPreparation() { if (await model.retry()) wizard.go("consent"); }
  async function retryCommand() { if (await model.retryCommand() && stage === "preparing") wizard.go("consent"); }
  return <CompanyWizardFrame stage={stage} ru={ru} locked={locked || activationPending || transitionPending} onClose={onBack}
    footer={controlledTest && stage !== "identity" && stage !== "checkout" && stage !== "success" && <p className={css.testNotice}>{ru ? "Тестовый режим · без списаний" : "Test mode · no charge"}</p>}>
    {stage === "identity" && identityConfirmation}
    {(stage === "name" || stage === "address") && <CompanyIdentityStep wizard={wizard} ru={ru} busy={locked} error={fieldError} onClose={onBack} />}
    {stage === "legal" && <CompanyLegalStep wizard={wizard} ru={ru} busy={locked} />}
    {stage === "consent" && <CompanyConsentStep ru={ru} name={wizard.values.displayName} hostname={setup?.hostname ?? `${wizard.values.slug}-falcon.saturnusgo.com`}
      plan={plan} quote={quote} consented={wizard.consented} locked={locked} paymentsAvailable={paymentsAvailable} canCheckout={canCheckout}
      onConsent={wizard.confirm} onBack={() => wizard.go("address")} onCheckout={checkoutAction} />}
    {stage === "checkout" && checkout && <CompanyCheckoutStep checkout={checkout} plan={plan} ru={ru} busy={locked} available={paymentsAvailable} controlledTest={controlledTest || localTest} onConfirm={outcome => {
      if (!locked && paymentsAvailable && checkout.testMode && (controlledTest || localTest)) void onConfirmCheckout?.(outcome);
    }} />}
    {stage === "loading" && <CompanyProgressStep name="" ru={ru} kind="loading" busy />}
    {stage === "preparing" && <CompanyProgressStep name={wizard.values.displayName} ru={ru} kind={setup?.status === "failed" || setup?.status === "expired" ? "failed" : "preparing"} busy={locked}
      canContinue={ready && wizard.consented && paymentsAvailable && canCheckout} onContinue={checkoutAction} />}
    {stage === "finishing" && <CompanyProgressStep name={wizard.values.displayName} ru={ru} kind="finishing" busy={busy} onRefresh={onRefreshBilling} />}
    {stage === "opening" && <CompanyProgressStep name={wizard.values.displayName} ru={ru} kind="opening" busy />}
    {stage === "success" && <CompanyProgressStep name={wizard.values.displayName} ru={ru} kind="success" busy={busy} onContinue={onContinue} />}
    {stage === "preparing" && !locked && (setup?.status === "failed" || setup?.status === "expired") && <div className={css.recovery}>
      {setup?.status === "failed" && <button type="button" onClick={() => void retryPreparation()}>{ru ? "Повторить подготовку" : "Retry preparation"}</button>}
      <button type="button" onClick={() => wizard.go("address")}>{ru ? "Изменить адрес" : "Edit address"}</button>
    </div>}
    {stage !== "identity" && error && !fieldError && <div className={css.recovery} role="alert"><p>{ru ? "Не удалось продолжить. Ваши данные сохранены." : "Could not continue. Your details are saved."}</p></div>}
    {model.canRetryCommand ? <div className={css.recovery}><button type="button" disabled={busy || model.busy} onClick={() => void retryCommand()}>{ru ? "Повторить то же действие" : "Retry the same action"}</button></div> : error && <div className={css.recovery}><button type="button" disabled={locked} onClick={model.reload}>{ru ? "Обновить данные" : "Refresh details"}</button></div>}
    {stage !== "identity" && checkoutNotice && <div className={css.checkoutNotice}>{checkoutNotice}</div>}
  </CompanyWizardFrame>;
}
