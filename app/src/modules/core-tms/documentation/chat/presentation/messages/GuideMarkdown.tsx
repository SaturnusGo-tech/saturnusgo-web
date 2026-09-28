import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import css from "../guide-chat.module.css";

export function GuideMarkdown({ content }: { content: string }) {
  return <div className={css.markdown}><ReactMarkdown skipHtml remarkPlugins={[remarkGfm]}
    disallowedElements={["img", "input", "iframe", "video", "audio"]} urlTransform={() => ""}
    components={{ a: ({ children }) => <span>{children}</span> }}>{content}</ReactMarkdown></div>;
}
