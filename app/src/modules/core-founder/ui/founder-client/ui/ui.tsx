import Link from "next/link";

const storyRows = [
  {
    index: "01",
    title: "Started from the ride problem",
    text: "The first idea was a taxi product, but the real pain was broader: movement, places, payments, and planning are fragmented.",
  },
  {
    index: "02",
    title: "Built as one product system",
    text: "SaturnusGo evolved into a mobile layer where rides, delivery, places, wallet, and partners can behave as one experience.",
  },
  {
    index: "03",
    title: "Designed for trust",
    text: "The product principle is simple: predictable UX, clear states, honest pricing, and no unnecessary complexity on the surface.",
  },
];

const principles = [
  {
    title: "Trust before scale",
    text: "A mobility product only works when users understand what is happening, what it costs, and who owns the next step.",
  },
  {
    title: "One motion",
    text: "People do not think in modules. They think in destinations, timing, money, and intent.",
  },
  {
    title: "Complexity inside",
    text: "Architecture can be deep, but the interface must feel simple, stable, and calm.",
  },
];

export default function FounderClient() {
  return (
    <main className="sg-page">
      <section className="sg-hero" aria-labelledby="founder-title">
        <div className="sg-hero-media" aria-hidden="true">
          <img src="/mock/hero-main.webp" alt="" />
        </div>
        <div className="sg-hero-inner">
          <span className="sg-kicker">SaturnusGo / Founder</span>
          <h1 id="founder-title">
            From a taxi idea to a city operating layer.
          </h1>
          <p>
            SaturnusGo started from a direct mobility problem and became a wider
            product thesis: one continuous flow for rides, delivery, places,
            payments, and local services.
          </p>
          <div className="sg-actions">
            <Link className="sg-button" href="/investors">
              Investor view
            </Link>
            <Link className="sg-button-ghost" href="/partners">
              Partner view
            </Link>
          </div>
        </div>
      </section>

      <section
        className="sg-section sg-light"
        aria-labelledby="founder-story-title"
      >
        <div className="sg-section-inner">
          <div className="sg-section-head">
            <span className="sg-eyebrow">Story</span>
            <div className="sg-section-copy">
              <h2 id="founder-story-title">
                The product did not stay inside the taxi category.
              </h2>
              <p>
                The important part is not founder mythology. The important part
                is the product judgment that turned a simple ride app into a
                broader city experience.
              </p>
            </div>
          </div>
          <div className="sg-rows">
            {storyRows.map((item) => (
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
        aria-labelledby="founder-principles-title"
      >
        <div className="sg-section-inner">
          <div className="sg-section-head">
            <span className="sg-eyebrow">Operating principles</span>
            <div className="sg-section-copy">
              <h2 id="founder-principles-title">How decisions are made.</h2>
              <p>
                These rules are more useful than a decorative biography because
                they explain why the product looks and behaves the way it does.
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
    </main>
  );
}
