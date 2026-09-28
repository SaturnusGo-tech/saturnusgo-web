import { ArrowUpRight } from "lucide-react";
import { useDocumentationCatalog } from "../../../access/useDocumentationCatalog";
import type { useDocumentationNavigation } from "../../../navigation/useDocumentationNavigation";
import { CopyButton } from "../../../presentation/controls/CopyButton";
import type { GuideMessage as Message } from "../../model/conversation";
import { visibleCitations } from "../../model/citations";
import { guideChatCopy } from "../../localization/copy";
import { GuideMarkdown } from "./GuideMarkdown";
import { visibleGuideVisuals } from "../../model/visuals/visible-visuals";
import { GuideVisuals } from "../visuals/GuideVisuals";
import css from "../guide-chat.module.css";
import { ShareAnswer } from "../../sharing/presentation/ShareAnswer";
import type { GuideHistoryApi } from "../../history/model/api";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";

export function GuideMessage({ message, navigation, onSource, streaming = false, sharing }: {
  message: Message; navigation: ReturnType<typeof useDocumentationNavigation>; onSource: () => void; streaming?: boolean;
  sharing?: { api: GuideHistoryApi; chatId: string; locale: "ru" | "en" };
}) {
  const { articleById } = useDocumentationCatalog(message.locale);
  const { locale } = useTmsLocale();
  const copy = guideChatCopy[locale];
  if (message.role === "user") return <div className={css.userMessage} aria-label={copy.you}>{message.content}</div>;
  const sources = streaming ? [] : visibleCitations(message.citations ?? [], articleById);
  const visuals = streaming ? [] : visibleGuideVisuals(message.visuals, articleById);
  const screenshots = visuals.flatMap(visual => visual.steps);
  return <article className={css.assistantMessage} aria-label={copy.assistant} aria-busy={streaming || undefined} aria-live={streaming ? "off" : undefined}
    id={message.id ? `guide-message-${message.id}` : undefined} data-guide-message={message.turnId} tabIndex={-1}>
    <span className={css.assistantName}>Falcon AI</span>
    <GuideMarkdown content={message.content} streaming={streaming} />
    {streaming && <span className={css.streamingStatus} role="status" aria-label={copy.responding}><span className={css.pulse} /></span>}
    {visuals.map((visual, index) => <GuideVisuals key={visual.key} visual={visual} copy={copy} screenshots={screenshots}
      startIndex={visuals.slice(0, index).reduce((total, group) => total + group.steps.length, 0)} />)}
    {sources.length > 0 && <nav className={css.sources} aria-label={copy.sources}>
      <span>{copy.sources}</span>
      {sources.map(source => <a key={`${source.articleId}:${source.sectionId}`} href={navigation.link(source.articleId, source.sectionId)}
        title={`${source.title} · ${source.sectionTitle}`} onClick={event => {
          navigation.navigate(event, source.articleId, source.sectionId);
          if (event.defaultPrevented) onSource();
        }}><span>{source.sectionTitle}</span><ArrowUpRight size={13} aria-hidden="true" /></a>)}
    </nav>}
    {!streaming && <div className={css.answerActions}><CopyButton value={message.content} label={copy.copy} />
      {sharing && message.turnId && <ShareAnswer {...sharing} turnId={message.turnId} />}</div>}
  </article>;
}
