import { publicBillingCatalog } from "../../domain/catalog/public-billing-catalog";
import { BillingPlans, type ManualBillingOffers } from "../../presentation/plans/BillingPlans";
import css from "../../presentation/screen/billing.module.css";

export function ManualPlanCatalog({ workspaceKind, offers, ru, failed, onReload, onClose }: {
  workspaceKind: "personal" | "company";
  offers?: ManualBillingOffers;
  ru: boolean;
  failed: boolean;
  onReload(): void;
  onClose?(): void;
}) {
  const loading = !offers && !failed;
  const pendingOffers: ManualBillingOffers = {
    action: () => ({
      label: failed ? (ru ? "Загрузить тарифы повторно" : "Retry loading plans") : (ru ? "Загружаем тарифы…" : "Loading plans…"),
      disabled: loading,
      onClick: onReload,
    }),
    notice: failed ? (ru ? "Не удалось загрузить данные для подключения." : "Could not load access requests.") : undefined,
  };

  return <div className={css.screen} aria-busy={loading}>
    <div className={css.offerStage}>
      <BillingPlans plans={publicBillingCatalog} current={null} occupiedSeats={0} workspaceKind={workspaceKind}
        canManage={false} busy={false} ru={ru} paymentsAvailable={false} manualOffers={offers ?? pendingOffers}
        onClose={onClose} onChoose={() => undefined} />
    </div>
  </div>;
}
