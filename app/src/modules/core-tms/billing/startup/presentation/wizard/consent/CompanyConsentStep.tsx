import { ArrowLeft, FolderTree, Globe2, UsersRound } from "lucide-react";
import type { BillingAccount, BillingPlan } from "../../../../domain/billing";
import css from "../../startup.module.css";
export function CompanyConsentStep({ ru, name, hostname, plan, quote, consented, locked, paymentsAvailable, canCheckout, manualAccess = false, onConsent, onBack, onCheckout }: {
  ru: boolean; name: string; hostname: string; plan?: BillingPlan; quote?: BillingAccount["checkoutQuotes"][number]; consented: boolean; locked: boolean; paymentsAvailable: boolean; canCheckout: boolean; manualAccess?: boolean;
  onConsent(value: boolean): void; onBack(): void; onCheckout(): void;
}) {
  const money = (value: number, currency: string) => new Intl.NumberFormat(ru ? "ru-RU" : "en-US", { style: "currency", currency }).format(value / 100);
  const disabled = locked || !canCheckout || !consented || !(manualAccess || paymentsAvailable && quote && plan);
  return <div>
    <h1>{ru ? "Ваше пространство. Теперь для всей команды." : "Your workspace. Now built for your team."}</h1>
    <p className={css.lead}>{ru ? `Создаём компанию «${name}» на основе вашего личного пространства.` : `Create ${name} from your existing personal workspace.`}</p>
    <ul className={css.benefits}>
      <li><FolderTree size={26} /><div><strong>{ru ? "Вся работа остаётся на месте" : "Your work stays with you"}</strong><p>{ru ? "Все проекты, тест-кейсы, прогоны и результаты этого пространства станут данными компании." : "Every project, test case, run and result in this workspace will become part of the company."}</p></div></li>
      <li><UsersRound size={26} /><div><strong>{ru ? "Пригласите свою команду" : "Bring your team together"}</strong><p>{ru ? `Startup включает ${plan?.seats ?? 5} мест. Вы сможете управлять сотрудниками в админке компании.` : `Startup includes ${plan?.seats ?? 5} seats. Manage your teammates in company administration.`}</p></div></li>
      <li><Globe2 size={26} /><div><strong>{ru ? "Собственный адрес Falcon" : "Your own Falcon address"}</strong><p className={css.hostname}>{hostname}</p></div></li>
    </ul>
    {!manualAccess && <div className={css.planLine}><span>Startup</span>{plan && <strong>{money(plan.amount, plan.currency)} <small>{ru ? "/ месяц + налоги" : "/ month + tax"}</small></strong>}</div>}
    {!manualAccess && quote && <p className={css.hint}>{ru ? "К оплате сейчас: " : "Due now: "}{money(quote.subtotal, quote.currency)}{quote.prorated ? (ru ? " · с учётом текущей подписки" : " · adjusted for your current subscription") : ""}</p>}
    <label className={css.consent}><input id="startup-consent" type="checkbox" checked={consented} disabled={locked} onChange={event => onConsent(event.target.checked)} /><span>{ru ? "Подтверждаю преобразование всего пространства в компанию, включая все существующие проекты." : "I confirm conversion of the whole workspace into a company, including all existing projects."}</span></label>
    {!manualAccess && !paymentsAvailable && <p className={css.hint}>{ru ? "Оплата пока недоступна." : "Payments are not available yet."}</p>}
    <footer className={css.actions}><button type="button" className={css.previous} disabled={locked} onClick={onBack}><ArrowLeft size={17} />{ru ? "Назад" : "Previous"}</button><button type="button" className={css.primary} data-wizard-checkout disabled={disabled} onClick={onCheckout}>{manualAccess ? (ru ? "Активировать Startup" : "Activate Startup") : (ru ? "Перейти к оплате" : "Continue to checkout")}</button></footer>
  </div>;
}
