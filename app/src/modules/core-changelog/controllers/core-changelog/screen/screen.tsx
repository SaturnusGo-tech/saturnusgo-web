const items = [
  {
    date: "2026",
    title: "Unified identity pass",
    text: "Public screens move to the Core Home rhythm: cinematic top, light reading body, dark product emphasis.",
  },
  {
    date: "2025",
    title: "Investor model and projections",
    text: "Investor materials received a dedicated analytical surface with animated projections and methodology support.",
  },
  {
    date: "2025",
    title: "Partner layer",
    text: "Partner onboarding, application flow, and business scenarios were separated from the consumer home story.",
  },
];

export default function Changelog() {
  return (
    <main className="sg-page">
      <section className="sg-hero" aria-labelledby="changelog-title">
        <div className="sg-hero-media" aria-hidden="true">
          <img src="/mock/device-preview.jpg" alt="" />
        </div>
        <div className="sg-hero-inner">
          <span className="sg-kicker">SaturnusGo / Changelog</span>
          <h1 id="changelog-title">
            Product changes with the same visual rhythm.
          </h1>
          <p>
            Changelog is a timeline, so it should be light, readable, and easy
            to scan after the initial dark entry.
          </p>
        </div>
      </section>

      <section className="sg-section sg-light" aria-labelledby="timeline-title">
        <div className="sg-section-inner">
          <div className="sg-section-head">
            <span className="sg-eyebrow">Timeline</span>
            <div className="sg-section-copy">
              <h2 id="timeline-title">What changed.</h2>
              <p>
                A restrained timeline reads better than a grid of blocks and
                keeps the content aligned with the new site identity.
              </p>
            </div>
          </div>
          <div className="sg-rows">
            {items.map((item, index) => (
              <article className="sg-row" key={item.title}>
                <span className="sg-row-index">{item.date}</span>
                <h3 className="sg-row-title">{item.title}</h3>
                <p className="sg-row-text">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="sg-marquee" aria-label="SaturnusGo product evolution">
        <div className="sg-marquee-rail">
          {[
            "Design",
            "Product",
            "Partners",
            "Mobility",
            "Payments",
            "Launch",
            "Design",
            "Product",
            "Partners",
            "Mobility",
            "Payments",
            "Launch",
          ].map((item, index) => (
            <span key={`${item}-${index}`}>{item}</span>
          ))}
        </div>
      </section>
    </main>
  );
}
