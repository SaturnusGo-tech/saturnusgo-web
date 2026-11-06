import css from "./identity-confirmation.module.css";

export function BillingCheckoutRecovery({ preparationRequired, busy, ru, onContinue }: {
  preparationRequired: boolean; busy: boolean; ru: boolean; onContinue(): void | Promise<void>;
}) {
  return <section className={css.identity} role="alert" aria-busy={busy}>
    <div className={css.copy}>
      <h3>{preparationRequired ? (ru ? "Подготовьте компанию заново" : "Prepare your company again") : (ru ? "Продолжите подключение Startup" : "Continue your Startup checkout")}</h3>
      <p>{preparationRequired
        ? (ru ? "Проверьте название и адрес компании, затем подтвердите подключение ещё раз." : "Review your company name and address before confirming checkout again.")
        : (ru ? "У вас осталось незавершённое действие. Продолжим его с сохранёнными данными." : "You have an unfinished checkout action. Continue with your saved details.")}</p>
    </div>
    <div className={css.actions}>
      <button type="button" className={css.primary} disabled={busy} onClick={() => { if (!busy) void onContinue(); }}>
        {preparationRequired ? (ru ? "Подготовить компанию заново" : "Prepare company again") : (ru ? "Продолжить оплату" : "Continue checkout")}
      </button>
    </div>
  </section>;
}
