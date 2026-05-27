import Link from "next/link";

const tiers = [
  {
    index: "01",
    title: "Стандартная",
    text: "Базовый доступ к городскому сценарию: поездки, сохранённые места, история и понятный финансовый слой.",
    value: "$8 / month",
  },
  {
    index: "02",
    title: "Расширенная",
    text: "Больше продуктовых преимуществ для частых поездок, delivery-сценариев и travel-планирования.",
    value: "$15 / month",
  },
  {
    index: "03",
    title: "Премиальная",
    text: "Приоритет, расширенные бонусы, улучшенный city-flow и premium-поведение внутри продукта.",
    value: "$29 / month",
  },
];

const principles = [
  {
    title: "No noisy pricing",
    text: "Тариф должен объяснять пользу, а не создавать ощущение таблицы с искусственными ограничениями.",
  },
  {
    title: "Scenario-based value",
    text: "Ценность подписки раскрывается в поездках, доставке, местах, бонусах и партнёрских сценариях.",
  },
  {
    title: "Readable upgrade path",
    text: "Пользователь должен понимать, зачем переходить выше, без мелкого шрифта и скрытых условий.",
  },
];

export default function PricingPage() {
  return (
    <main className="sg-page">
      <section className="sg-hero" aria-labelledby="pricing-title">
        <div className="sg-hero-media" aria-hidden="true">
          <img src="/mock/module-trips.webp" alt="" />
        </div>
        <div className="sg-hero-inner">
          <span className="sg-kicker">SaturnusGo / Pricing</span>
          <h1 id="pricing-title">A subscription layer for real city usage.</h1>
          <p>
            Pricing should feel like part of the product, not a detached SaaS
            grid. The plan must support movement, delivery, places, bonuses, and
            partner value.
          </p>
          <div className="sg-actions">
            <Link className="sg-button" href="/#download-app">
              Join launch access
            </Link>
            <Link className="sg-button-ghost" href="/features">
              See features
            </Link>
          </div>
        </div>
      </section>

      <section className="sg-section sg-light" aria-labelledby="plans-title">
        <div className="sg-section-inner">
          <div className="sg-section-head">
            <span className="sg-eyebrow">Plans</span>
            <div className="sg-section-copy">
              <h2 id="plans-title">Three levels, one product logic.</h2>
              <p>
                The pricing page keeps the same editorial rhythm as the home
                screen: dark entry, light decision area, dark product thesis.
              </p>
            </div>
          </div>
          <div className="sg-rows">
            {tiers.map((tier) => (
              <article className="sg-row" key={tier.title}>
                <span className="sg-row-index">{tier.index}</span>
                <h3 className="sg-row-title">{tier.title}</h3>
                <p className="sg-row-text">
                  <strong>{tier.value}</strong>
                  <br />
                  {tier.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="sg-section sg-dark"
        aria-labelledby="pricing-principles-title"
      >
        <div className="sg-section-inner">
          <div className="sg-section-head">
            <span className="sg-eyebrow">Pricing logic</span>
            <div className="sg-section-copy">
              <h2 id="pricing-principles-title">
                The plan should explain the product.
              </h2>
              <p>
                SaturnusGo is not a coupon page. Subscription value has to be
                tied to the same movement system users experience on the main
                screen.
              </p>
            </div>
          </div>
          <div className="sg-panel-grid">
            {principles.map((item) => (
              <article className="sg-panel" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="sg-section sg-light"
        aria-labelledby="pricing-next-title"
      >
        <div className="sg-section-inner">
          <div className="sg-section-head">
            <span className="sg-eyebrow">Next step</span>
            <div className="sg-section-copy">
              <h2 id="pricing-next-title">
                Launch pricing stays flexible until release.
              </h2>
              <p>
                Final commercial terms should be validated against real city
                behavior, ride frequency, partner supply, and payment mechanics.
              </p>
              <div className="sg-actions">
                <Link className="sg-button" href="/partners">
                  Partner with SaturnusGo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
