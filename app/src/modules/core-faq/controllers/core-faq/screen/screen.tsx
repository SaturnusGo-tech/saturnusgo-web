const questions = [
  {
    index: "01",
    title: "What is SaturnusGo?",
    text: "A mobile product that connects rides, delivery, places, wallet, and partner services into one city flow.",
  },
  {
    index: "02",
    title: "Is it only a taxi app?",
    text: "No. The ride layer is the entry point, but the product is built around movement, discovery, payments, and partners.",
  },
  {
    index: "03",
    title: "Where will it launch first?",
    text: "The first commercial focus is South America, with Argentina as the most natural starting market.",
  },
  {
    index: "04",
    title: "Can partners join before launch?",
    text: "Yes. Hotels, restaurants, cafés, venues, and local services can apply through the partner flow.",
  },
  {
    index: "05",
    title: "Why does the site alternate dark and light sections?",
    text: "The home screen defines the rhythm: cinematic entry, light reading areas, and dark product emphasis where depth is needed.",
  },
];

export default function FaqPage() {
  return (
    <main className="sg-page">
      <section className="sg-hero" aria-labelledby="faq-title">
        <div className="sg-hero-media" aria-hidden="true">
          <img src="/mock/module-places.jpg" alt="" />
        </div>
        <div className="sg-hero-inner">
          <span className="sg-kicker">SaturnusGo / FAQ</span>
          <h1 id="faq-title">
            Answers without turning the page into a black wall.
          </h1>
          <p>
            FAQ is a reading screen. It keeps the cinematic entrance but moves
            the actual answers into a calm light section.
          </p>
        </div>
      </section>

      <section className="sg-section sg-light" aria-labelledby="faq-list-title">
        <div className="sg-section-inner">
          <div className="sg-section-head">
            <span className="sg-eyebrow">Questions</span>
            <div className="sg-section-copy">
              <h2 id="faq-list-title">The short version.</h2>
              <p>
                Clean rows are easier to scan than heavy cards, especially on
                support and documentation-like pages.
              </p>
            </div>
          </div>
          <div className="sg-rows">
            {questions.map((item) => (
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
        aria-labelledby="faq-support-title"
      >
        <div className="sg-section-inner">
          <div className="sg-section-head">
            <span className="sg-eyebrow">Still unclear</span>
            <div className="sg-section-copy">
              <h2 id="faq-support-title">
                Support should continue the product flow.
              </h2>
              <p>
                If the answer depends on a real ride, payment, partner, or
                place, the correct UX is contextual support, not a generic FAQ
                block.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
