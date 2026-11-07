import { publicBillingCatalog } from "../../domain/catalog/public-billing-catalog";
import { BillingPlans, type ManualBillingOffers } from "../../presentation/plans/BillingPlans";
import css from "../../presentation/screen/billing.module.css";

export function ManualPlanCatalog({ workspaceKind, offers, ru, failed, accessDenied, onReload, onContact, onClose }: {
  workspaceKind: "personal" | "company";
  offers?: ManualBillingOffers;
  ru: boolean;
  failed: boolean;
  accessDenied: boolean;
  onReload(): void;
  onContact?(): void;
  onClose?(): void;
}) {
  const loading = !offers && !failed && !accessDenied;
  const pendingOffers: ManualBillingOffers = {
    action: () => ({
      label: failed ? (ru ? "Загрузить тарифы повторно" : "Retry loading plans") : (ru ? "Загружаем тарифы…" : "Loading plans…"),
      disabled: loading,
      onClick: onReload,
    }),
    notice: failed ? (ru ? "Не удалось загрузить данные для подключения." : "Could not load access requests.") : undefined,
  };
  const unavailableOffers: ManualBillingOffers = {
    action(planId) {
      if (planId === "enterprise" && onContact) {
        return { label: ru ? "Связаться с нами" : "Contact us", onClick: onContact };
      }
      return { label: ru ? "Недоступно для этого пространства" : "Unavailable for this workspace", disabled: true, onClick() {} };
    },
  };

  return <div className={css.screen} aria-busy={loading}>
    <div className={css.offerStage}>
      <BillingPlans plans={publicBillingCatalog} current={null} occupiedSeats={0} workspaceKind={workspaceKind}
        canManage={false} busy={false} ru={ru} paymentsAvailable={false} manualOffers={offers ?? (accessDenied ? unavailableOffers : pendingOffers)}
        onClose={onClose} onChoose={() => undefined} />
    </div>
  </div>;
}
