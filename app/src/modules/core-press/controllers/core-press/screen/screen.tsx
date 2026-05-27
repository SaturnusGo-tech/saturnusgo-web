import Link from "next/link";

const facts = [
  {
    index: "01",
    title: "Company",
    text: "SaturnusGo is a city mobility and travel product built around rides, delivery, places, wallet, and partners.",
  },
  {
    index: "02",
    title: "Category",
    text: "Urban mobility, travel intelligence, payments, and local commerce in one mobile experience.",
  },
  {
    index: "03",
    title: "Contact",
    text: "press@saturnusgo.com",
  },
];

export default function Press() {
  return (
    <main className="sg-page">
      <section className="sg-hero" aria-labelledby="press-title">
        <div className="sg-hero-media" aria-hidden="true">
          <img src="/mock/hero-main.webp" alt="" />
        </div>
        <div className="sg-hero-inner">
          <span className="sg-kicker">SaturnusGo / Press</span>
          <h1 id="press-title">A cleaner media page for the product story.</h1>
          <p>
            The press page should be readable and calm, not another dark empty
            surface. It now follows the same dark-to-light rhythm as the home
            screen.
          </p>
        </div>
      </section>

      <section
        className="sg-section sg-light"
        aria-labelledby="press-facts-title"
      >
        <div className="sg-section-inner">
          <div className="sg-section-head">
            <span className="sg-eyebrow">Media facts</span>
            <div className="sg-section-copy">
              <h2 id="press-facts-title">
                Useful information without decorative cards.
              </h2>
              <p>
                Press pages work better as clean fact rows: company, category,
                founder context, and direct contact.
              </p>
            </div>
          </div>
          <div className="sg-rows">
            {facts.map((item) => (
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
        aria-labelledby="press-next-title"
      >
        <div className="sg-section-inner">
          <div className="sg-section-head">
            <span className="sg-eyebrow">Request</span>
            <div className="sg-section-copy">
              <h2 id="press-next-title">
                For interviews, screenshots, and launch context.
              </h2>
              <p>
                Contact the team directly. Product visuals should be shared from
                the latest build, not from old legacy page screenshots.
              </p>
              <div className="sg-actions">
                <Link className="sg-button" href="mailto:press@saturnusgo.com">
                  press@saturnusgo.com
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
