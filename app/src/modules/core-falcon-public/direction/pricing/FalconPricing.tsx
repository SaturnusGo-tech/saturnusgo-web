import { Check } from 'lucide-react';
import { FalconBrandMark } from '../../../../shared/components/brand/FalconBrandMark';
import { enterprisePriceExample, formatBillingAmount, publicBillingCatalog } from '../../../core-tms/billing/domain/catalog/public-billing-catalog';
import { planNames } from '../../../core-tms/billing/requests/domain/plan-request';
import type { LandingLocale } from '../../landing/localization/model/locale';
import { PricingPlanPages } from './PricingPlanPages';
import styles from './pricing.module.css';

const copy = {
  en: {
    title: 'Pricing',
    interval: '/mo',
    quote: 'On request',
    example: (price: string, seats: number) => `Illustrative price for ${seats} seats is ${price} per month.`,
    request: 'Request access',
    contact: 'Contact us',
    trial: 'Try Falcon free for 7 days',
    tax: 'USD pricing, plus applicable tax.',
    descriptions: {
      individual: 'Own your QA workflow from the first check to release.',
      startup: 'Give your team one place to coordinate QA.',
    },
    features: {
      individual: [
        'Get started without company details',
        'Activate on your trial workspace',
        'View and export data after the trial',
        'Keep your projects if you move to Startup',
      ],
      startup: [
        'Your own Falcon address',
        'Company administration',
        'Invite teammates and assign roles',
        'Bring your projects and test history',
      ],
      enterprise: [
        'Seats sized to your organization',
        'Subscription terms by agreement',
        'Roles and access tailored to your needs',
        'SAML SSO setup by agreement',
        'Rollout discussed with your team',
      ],
    },
  },
  ru: {
    title: 'Тарифы',
    interval: '/мес.',
    quote: 'По запросу',
    example: (price: string, seats: number) => `Ориентир для ${seats} мест — ${price} в месяц.`,
    request: 'Запросить подключение',
    contact: 'Связаться с нами',
    trial: 'Попробуйте Falcon бесплатно 7 дней',
    tax: 'Цены в долларах США без учёта налогов.',
    descriptions: {
      individual: 'Ведите QA самостоятельно от первой проверки до релиза.',
      startup: 'Объедините работу команды QA в одном месте.',
    },
    features: {
      individual: [
        'Старт без реквизитов компании',
        'Подключение без переноса данных',
        'Просмотр и экспорт после триала',
        'Проекты сохранятся в Startup',
      ],
      startup: [
        'Свой адрес в Falcon',
        'Админка компании',
        'Приглашения и назначение ролей',
        'Сохранение проектов и истории',
      ],
      enterprise: [
        'Количество мест под вашу команду',
        'Условия подписки по согласованию',
        'Доступ по правилам компании',
        'Настройка единого входа SAML',
        'Обсуждение плана внедрения',
      ],
    },
  },
} as const;

const horizon = 'M 273 853 C 310 770 352 708 425 667 C 541 602 704 602 813 548 C 893 508 902 424 884 325 C 866 229 864 136 903 41';

export function FalconPricing({ locale }: { locale: LandingLocale }) {
  const c = copy[locale];
  const example = c.example(formatBillingAmount(enterprisePriceExample.amount, enterprisePriceExample.currency, locale), enterprisePriceExample.seats);
  const plans = [
    ...publicBillingCatalog.map(plan => ({
      id: plan.id,
      name: planNames[plan.id],
      price: formatBillingAmount(plan.amount, plan.currency, locale),
      interval: c.interval,
      features: [
        locale === 'ru'
          ? plan.seats === 1 ? '1 место' : `${plan.seats} мест для команды`
          : plan.seats === 1 ? '1 seat' : `${plan.seats} team seats`,
        ...c.features[plan.id],
      ],
      action: c.request,
    })),
    {
      id: 'enterprise',
      name: planNames.enterprise,
      price: c.quote,
      interval: '',
      features: c.features.enterprise,
      action: c.contact,
    } as const,
  ];

  return <section className={styles.pricing} id="plans" aria-labelledby="plans-title">
    <div className={styles.stage}>
      <div className={styles.light} aria-hidden="true">
        <svg viewBox="0 0 1298 820" preserveAspectRatio="xMidYMin slice" focusable="false">
          <defs>
            <linearGradient id="pricing-light-color" x1="0" y1="820" x2="0" y2="45" gradientUnits="userSpaceOnUse">
              <stop stopColor="#26b8e3" />
              <stop offset=".17" stopColor="#b0f6ff" />
              <stop offset=".36" stopColor="#ebfaff" />
              <stop offset=".58" stopColor="#3ac2f0" />
              <stop offset=".8" stopColor="#196cf1" />
              <stop offset="1" stopColor="#162ca6" stopOpacity="0" />
            </linearGradient>
            <filter id="pricing-light-halo" x="-50%" width="200%" y="-50%" height="200%"><feGaussianBlur stdDeviation="31" /></filter>
            <filter id="pricing-light-edge" x="-20%" width="140%" y="-20%" height="140%"><feGaussianBlur stdDeviation="2.5" /></filter>
          </defs>
          <path d={horizon} className={styles.blueHalo} transform="translate(34 18)" />
          <path d={horizon} className={styles.halo} />
          <path d={horizon} className={styles.edge} />
        </svg>
      </div>
      <div className={styles.masthead}>
        <span className={styles.wordmark} aria-hidden="true">
          <FalconBrandMark className={styles.wordmarkIcon} />
          Falcon
        </span>
        <h2 id="plans-title" className={styles.title}>{c.title}</h2>
      </div>
      <PricingPlanPages label={c.title} plans={plans.map(plan => plan.name)}>
        {plans.map(plan => <article className={styles.card} data-plan={plan.id} key={plan.id}>
          <h3>{plan.name}</h3>
          <p className={styles.price}>{plan.price}{plan.interval}</p>
          <p className={styles.description}>{plan.id === 'enterprise' ? example : c.descriptions[plan.id]}</p>
          <ul className={styles.features}>
            {plan.features.map(feature => <li key={feature}>
              <span className={styles.check}><Check size={16} strokeWidth={2.25} aria-hidden="true" /></span>
              <span>{feature}</span>
            </li>)}
          </ul>
          <a className={styles.action} aria-label={`${plan.action} · ${plan.name}`} href={`/cloud-login/?lang=${locale}&requestPlan=${plan.id}`}>
            {plan.action}
          </a>
        </article>)}
      </PricingPlanPages>
    </div>
    <div className={styles.notes}>
      <a href={`/signup/?lang=${locale}`}>{c.trial}</a>
      <p>{c.tax}</p>
    </div>
  </section>;
}
