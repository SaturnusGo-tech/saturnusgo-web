import type { BillingInvoice } from "../../domain/billing";
import css from "../screen/billing.module.css";

type Props = { invoices: readonly BillingInvoice[]; ru: boolean; hasMore: boolean; loadingMore: boolean; failed: boolean; onMore(): void };
export function BillingInvoices({ invoices, ru, hasMore, loadingMore, failed, onMore }: Props) {
  const money = (amount: number, currency: string) => new Intl.NumberFormat(ru ? "ru-RU" : "en-US", { style: "currency", currency }).format(amount / 100);
  const names = { individual: "Individual", startup: "Startup", enterprise: "Enterprise" };
  const statuses = ru ? { paid: "Оплачен", failed: "Отклонён", refunded: "Возвращён" } : { paid: "Paid", failed: "Failed", refunded: "Refunded" };
  return <section className={css.section} aria-labelledby="billing-invoices-title">
    <header className={css.sectionHeading}><h3 id="billing-invoices-title">{ru ? "История счетов" : "Invoice history"}</h3></header>
    {!invoices.length && !failed && <p className={css.muted}>{ru ? "Счета появятся после первого платежа." : "Invoices appear after your first payment."}</p>}
    {invoices.length > 0 && <div className={css.tableWrap}><table className={css.table}>
      <caption>{ru ? "Суммы включают налоги, указанные в счёте. Тестовые счета не подтверждают оплату." : "Totals include the tax recorded on each invoice. Test invoices are not proof of payment."}</caption>
      <thead><tr><th scope="col">{ru ? "Дата" : "Date"}</th><th scope="col">{ru ? "Тариф" : "Plan"}</th><th scope="col">{ru ? "Статус" : "Status"}</th><th scope="col">{ru ? "Налог" : "Tax"}</th><th scope="col">{ru ? "Итого" : "Total"}</th></tr></thead>
      <tbody>{invoices.map(row => <tr key={row.id}>
        <td>{new Intl.DateTimeFormat(ru ? "ru-RU" : "en-US", { dateStyle: "medium" }).format(new Date(row.periodStart))}</td>
        <td>{names[row.planId]}</td><td>{statuses[row.status]}{row.testMode && <span className={css.muted}> · {ru ? "Тест" : "Test"}</span>}</td>
        <td>{money(row.tax, row.currency)}</td><td>{money(row.total, row.currency)}</td>
      </tr>)}</tbody>
    </table></div>}
    {failed && <p className={css.note} role="alert">{ru ? "Не удалось загрузить счета." : "Could not load invoices."}</p>}
    {(hasMore || failed) && <div className={css.actions}><button type="button" className={css.secondary} disabled={loadingMore} onClick={onMore}>{loadingMore ? (ru ? "Загрузка…" : "Loading…") : failed ? (ru ? "Повторить" : "Try again") : (ru ? "Показать ещё" : "Load more")}</button></div>}
  </section>;
}
