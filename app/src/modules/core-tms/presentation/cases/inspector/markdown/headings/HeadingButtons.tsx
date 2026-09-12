import css from "./headings.module.css";

type Heading = "h1" | "h2" | "h3";
export function HeadingButtons({ ru, current, onChoose, tabIndex }: {
  ru: boolean; current?: string; onChoose: (heading: Heading) => void; tabIndex?: number;
}) {
  return <span className={css.headings} role="group" aria-label={ru ? "Заголовки" : "Headings"}>
    {(["h1", "h2", "h3"] as const).map((heading, index) => <button key={heading} type="button"
      tabIndex={tabIndex} title={ru ? `Заголовок ${index + 1}` : `Heading ${index + 1}`}
      aria-label={ru ? `Заголовок ${index + 1}` : `Heading ${index + 1}`} aria-pressed={current === heading}
      onMouseDown={(event) => event.preventDefault()} onClick={() => onChoose(heading)}>
      H<sub>{index + 1}</sub>
    </button>)}
  </span>;
}
