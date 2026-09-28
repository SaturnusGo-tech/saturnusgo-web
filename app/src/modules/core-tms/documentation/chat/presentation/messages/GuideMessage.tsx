import { ArrowUpRight } from "lucide-react";
import { useDocumentationCatalog } from "../../../access/useDocumentationCatalog";
import type { useDocumentationNavigation } from "../../../navigation/useDocumentationNavigation";
import { CopyButton } from "../../../presentation/controls/CopyButton";
import type { GuideMessage as Message } from "../../model/conversation";
import { visibleCitations } from "../../model/citations";
import { guideChatCopy } from "../../localization/copy";
import { GuideMarkdown } from "./GuideMarkdown";
import css from "../guide-chat.module.css";

export function GuideMessage({ message, navigation, onSource }: {
  message: Message; navigation: ReturnType<typeof useDocumentationNavigation>; onSource: () => void;
}) {
  const { articleById, locale } = useDocumentationCatalog();
  const copy = guideChatCopy[locale];
  if (message.role === "user") return <div className={css.userMessage} aria-label={copy.you}>{message.content}</div>;
  const sources = visibleCitations(message.citations ?? [], articleById);
  return <article className={css.assistantMessage} aria-label={copy.assistant}>
    <span className={css.assistantName}>Falcon AI</span>
    <GuideMarkdown content={message.content} />
    {sources.length > 0 && <nav className={css.sources} aria-label={copy.sources}>
      <span>{copy.sources}</span>
      {sources.map(source => <a key={`${source.articleId}:${source.sectionId}`} href={navigation.link(source.articleId, source.sectionId)}
        title={`${source.title} · ${source.sectionTitle}`} onClick={event => {
          navigation.navigate(event, source.articleId, source.sectionId);
          if (event.defaultPrevented) onSource();
        }}><span>{source.sectionTitle}</span><ArrowUpRight size={13} aria-hidden="true" /></a>)}
    </nav>}
    <div className={css.answerActions}><CopyButton value={message.content} label={copy.copy} /></div>
  </article>;
}
