import type { ProductDocTitleHighlight } from "../../../domain/product-docs";
import marker from "../../../../presentation/cases/inspector/markdown/highlight/highlight.module.css";
import { titleRuns } from "./model/productDocTitleHighlights";

export function ProductDocTitleText({ title, highlights }: {
  title: string;
  highlights?: readonly ProductDocTitleHighlight[];
}) {
  if (!highlights?.length) return title;
  return <span className={marker.surface}>
    {titleRuns(title, highlights).map(({ text, color, offset }) =>
      color ? <mark key={offset} data-marker={color}>{text}</mark> : text)}
  </span>;
}
