import Link from "next/link";

const surfaces = [
  {
    index: "01",
    title: "Ride core",
    text: "Taxi, pickup, route context, pricing preview, and the movement layer that starts every city scenario.",
  },
  {
    index: "02",
    title: "Delivery",
    text: "Courier scenarios tied to real places, addresses, and city intent instead of a separate disconnected utility.",
  },
  {
    index: "03",
    title: "Places",
    text: "Curated discovery, collections, local recommendations, and destination context inside the same product flow.",
  },
  {
    index: "04",
    title: "Wallet",
    text: "Payments, balance, cards, bonuses, receipts, and subscriptions built as one financial layer.",
  },
];

const guarantees = [
  {
    title: "Predictable UX",
    text: "The interface keeps the user oriented: clear states, readable transitions, and no forced context switching.",
  },
  {
    title: "Modular product",
    text: "Each surface can evolve independently while still behaving as one SaturnusGo experience.",
  },
  {
    title: "Operational trust",
    text: "Every scenario needs clear pricing, routing, partner context, and support entry points before scale.",
  },
];

const details = [
  "Real-time ride and delivery flows",
  "Saved places and city collections",
  "Partner visibility for hotels, cafés, events, and services",
  "Payment and bonus mechanics tied to the active scenario",
  "Launch-ready product surfaces for city-by-city rollout",
];

export default function FeaturesPage() {
  return (
    <main className="sg-page">
      <section className="sg-hero" aria-labelledby="features-title">
        <div className="sg-hero-media" aria-hidden="true">
          <img src="/mock/hero-main.webp" alt="" />
        </div>
        <div className="sg-hero-inner">
          <span className="sg-kicker">SaturnusGo / Features</span>
          <h1 id="features-title">
            Product surfaces that behave as one city system.
          </h1>
          <p>
            Rides, delivery, places, payments, and partner scenarios are not
            separate landing-page promises. They are designed to work as one
            continuous user flow.
          </p>
          <div className="sg-actions">
            <Link className="sg-button" href="/#experience">
              Explore the flow
            </Link>
            <Link className="sg-button-ghost" href="/partners">
              Partner layer
            </Link>
          </div>
        </div>
      </section>

      <section className="sg-section sg-light" aria-labelledby="surfaces-title">
        <div className="sg-section-inner">
          <div className="sg-section-head">
            <span className="sg-eyebrow">Core modules</span>
            <div className="sg-section-copy">
              <h2 id="surfaces-title">
                The app is built around movement, not menus.
              </h2>
              <p>
                Each feature has a concrete role in the city journey. The user
                should not feel module boundaries while moving through the
                product.
              </p>
            </div>
          </div>
          <div className="sg-rows">
            {surfaces.map((item) => (
              <article className="sg-row" key={item.title}>
                <span className="sg-row-index">{item.index}</span>
                <h3 className="sg-row-title">{item.title}</h3>
                <p className="sg-row-text">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="sg-section sg-dark"
        aria-labelledby="guarantees-title"
      >
        <div className="sg-section-inner">
          <div className="sg-section-head">
            <span className="sg-eyebrow">Product standard</span>
            <div className="sg-section-copy">
              <h2 id="guarantees-title">What every surface must preserve.</h2>
              <p>
                The design system is not only visual. It defines how the product
                behaves when users switch from search to movement to payment.
              </p>
            </div>
          </div>
          <div className="sg-panel-grid">
            {guarantees.map((item) => (
              <article className="sg-panel" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="sg-section sg-light" aria-labelledby="details-title">
        <div className="sg-section-inner">
          <div className="sg-section-head">
            <span className="sg-eyebrow">Scope</span>
            <div className="sg-section-copy">
              <h2 id="details-title">The current product map.</h2>
              <p>
                This is the practical surface area SaturnusGo needs for the
                first launch wave and partner conversations.
              </p>
            </div>
          </div>
          <div className="sg-rows">
            {details.map((detail, index) => (
              <article className="sg-row" key={detail}>
                <span className="sg-row-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="sg-row-title">{detail}</h3>
                <p className="sg-row-text">
                  Kept as a first-class product capability instead of a
                  decorative marketing block.
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="sg-marquee" aria-label="SaturnusGo feature flow">
        <div className="sg-marquee-rail">
          {[
            "Ride",
            "Delivery",
            "Places",
            "Wallet",
            "Partners",
            "City flow",
            "Ride",
            "Delivery",
            "Places",
            "Wallet",
            "Partners",
            "City flow",
          ].map((item, index) => (
            <span key={`${item}-${index}`}>{item}</span>
          ))}
        </div>
      </section>
    </main>
  );
}
