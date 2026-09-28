import ReactMarkdown from "react-markdown";
import { guideRemarkPlugins } from "../formatting/guide-formatting";
import highlight from "../../../../presentation/cases/inspector/markdown/highlight/highlight.module.css";
import css from "../guide-chat.module.css";

export function GuideMarkdown({ content, streaming = false }: { content: string; streaming?: boolean }) {
  return <div className={`${css.markdown} ${highlight.surface}`}><ReactMarkdown skipHtml remarkPlugins={guideRemarkPlugins(streaming)}
    disallowedElements={["img", "input", "iframe", "video", "audio"]} urlTransform={() => ""}
    components={{ a: ({ children }) => <span>{children}</span> }}>{content}</ReactMarkdown></div>;
}
