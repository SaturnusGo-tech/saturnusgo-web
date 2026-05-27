import Link from "next/link";

const paths = [
  {
    index: "01",
    title: "Ride and delivery help",
    text: "Issues around pickup, route, courier handoff, destination, pricing, or active order state.",
  },
  {
    index: "02",
    title: "Payments and wallet",
    text: "Cards, balance, top-up, subscriptions, receipts, bonuses, and transaction clarity.",
  },
  {
    index: "03",
    title: "Partners and places",
    text: "Listings, business profile, visibility, availability, contact routes, and content accuracy.",
  },
];

const process = [
  {
    title: "Context first",
    text: "Support starts from the active scenario, not from a generic ticket form. The user should never re-explain the whole flow.",
  },
  {
    title: "Clear ownership",
    text: "Each case needs one responsible path: SaturnusGo, partner, driver, courier, or payment provider.",
  },
  {
    title: "Readable resolution",
    text: "The answer should explain what happened, what changed, and what the user can do next.",
  },
];

export default function SupportPage() {
  return (
    <main className="sg-page">
      <section className="sg-hero" aria-labelledby="support-title">
        <div className="sg-hero-media" aria-hidden="true">
          <img src="/mock/module-transport.jpg" alt="" />
        </div>
        <div className="sg-hero-inner">
          <span className="sg-kicker">SaturnusGo / Support</span>
          <h1 id="support-title">
            Support built around the active city scenario.
          </h1>
          <p>
            Help should not feel like a separate product. The support layer must
            understand whether the user is riding, paying, saving a place, or
            interacting with a partner.
          </p>
          <div className="sg-actions">
            <Link className="sg-button" href="/faq">
              Open FAQ
            </Link>
            <Link
              className="sg-button-ghost"
              href="mailto:support@saturnusgo.com"
            >
              Contact support
            </Link>
          </div>
        </div>
      </section>

      <section
        className="sg-section sg-light"
        aria-labelledby="support-paths-title"
      >
        <div className="sg-section-inner">
          <div className="sg-section-head">
            <span className="sg-eyebrow">Support paths</span>
            <div className="sg-section-copy">
              <h2 id="support-paths-title">
                Every request should land in the right lane.
              </h2>
              <p>
                A clean support experience is routing, context, and ownership.
                The page follows the same light reading area as Core Home.
              </p>
            </div>
          </div>
          <div className="sg-rows">
            {paths.map((item) => (
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
        aria-labelledby="support-process-title"
      >
        <div className="sg-section-inner">
          <div className="sg-section-head">
            <span className="sg-eyebrow">Resolution model</span>
            <div className="sg-section-copy">
              <h2 id="support-process-title">No ticket black box.</h2>
              <p>
                SaturnusGo support has to reflect the premium product promise:
                fast orientation, clear responsibility, and visible next steps.
              </p>
            </div>
          </div>
          <div className="sg-panel-grid">
            {process.map((item) => (
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
        aria-labelledby="support-contact-title"
      >
        <div className="sg-section-inner">
          <div className="sg-section-head">
            <span className="sg-eyebrow">Contact</span>
            <div className="sg-section-copy">
              <h2 id="support-contact-title">
                Send a clear case, get a clear route.
              </h2>
              <p>
                For launch conversations and early support, contact the team
                directly. In-product support should later inherit the same
                logic.
              </p>
              <div className="sg-actions">
                <Link
                  className="sg-button"
                  href="mailto:support@saturnusgo.com"
                >
                  support@saturnusgo.com
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
