import { ArrowUpRight, Plus, RotateCcw, X } from "lucide-react";
import type { useGuideConversation } from "../state/useGuideConversation";
import type { useDocumentationNavigation } from "../../navigation/useDocumentationNavigation";
import { guideChatCopy } from "../localization/copy";
import { GuideMessage } from "./messages/GuideMessage";
import { GuideComposer } from "./composer/GuideComposer";
import { useConversationScroll } from "./scroll/useConversationScroll";
import css from "./guide-chat.module.css";
import { ChatHistoryPopover } from "../history/presentation/ChatHistoryPopover";
import { guideHistoryCopy } from "../history/localization/copy";

export function DocumentationChat({ chat, navigation, onSource }: {
  chat: ReturnType<typeof useGuideConversation>; navigation: ReturnType<typeof useDocumentationNavigation>; onSource: () => void;
}) {
  const copy = guideChatCopy[chat.locale];
  const historyCopy = guideHistoryCopy[chat.locale];
  const { scroll, onScroll } = useConversationScroll(`${chat.messages.length}:${chat.partialText}:${chat.busy}`, chat.messages.length, chat.conversationId, chat.targetTurnId);
  return <section className={css.chat} aria-label={copy.title} data-documentation-chat>
    <div className={css.toolbar}>
      <span className={css.conversationTitle}>{chat.readonly ? historyCopy.shared : chat.title}</span>
      <ChatHistoryPopover chat={chat} />
      <button type="button" className={css.iconButton} aria-label={copy.newChat} title={copy.newChat}
        onClick={chat.newChat} disabled={!chat.chatId && !chat.readonly && !chat.messages.length && !chat.draft && !chat.error}><Plus size={18} /></button>
    </div>
    <div className={css.conversationScroll} ref={scroll} onScroll={onScroll}>
      {chat.loadError ? <div className={css.empty}><p role="alert">{chat.readonly ? historyCopy.sharedMissing : historyCopy[chat.loadError]}</p>
        <button className={css.loadEarlier} type="button" onClick={chat.refresh}>{historyCopy.retry}</button></div>
        : chat.loading && !chat.messages.length ? <div className={css.empty}><p role="status">{historyCopy.loading}</p></div>
        : !chat.messages.length ? <div className={css.empty}>
        <h1>{copy.heading}</h1><p>{copy.introduction}</p>
        <div className={css.suggestions}>{copy.suggestions.map(question => <button key={question} type="button"
          disabled={!chat.enabled || chat.busy} onClick={() => chat.setDraft(question)}><span>{question}</span><ArrowUpRight size={15} aria-hidden="true" /></button>)}</div>
      </div> : <div className={css.conversation} role="log" aria-label={copy.conversation} aria-live="polite" aria-relevant="additions">
        {chat.cursor && <button type="button" className={css.loadEarlier} onClick={chat.loadEarlier} disabled={chat.loading}>{historyCopy.earlier}</button>}
        {chat.messages.map((message, index) => <GuideMessage key={message.id ?? `${chat.conversationId}:${index}`} message={message} navigation={navigation} onSource={onSource}
          sharing={!chat.readonly && chat.api && chat.chatId ? { api: chat.api, chatId: chat.chatId, locale: chat.locale } : undefined} />)}
        {chat.busy && chat.partialText && <GuideMessage message={{ role: "assistant", content: chat.partialText, locale: chat.contentLocale }} navigation={navigation} onSource={onSource} streaming />}
        {chat.busy && !chat.partialText && <div className={css.preparing} role="status"><span className={css.pulse} />{copy.preparing}</div>}
      </div>}
    </div>
    {chat.notice && <div className={css.notice} role="status"><span>{historyCopy[chat.notice]}</span>
      {chat.notice === "pending" && <button type="button" onClick={chat.refresh}>{historyCopy.refresh}</button>}</div>}
    {chat.error && <div className={css.error} role="alert"><p>{copy[chat.error]}</p>
      <button type="button" onClick={chat.retry} disabled={!chat.enabled || !chat.draft.trim()}><RotateCcw size={14} />{copy.retry}</button>
      <button type="button" className={css.iconButton} onClick={chat.dismissError} aria-label={copy.dismiss}><X size={15} /></button>
    </div>}
    {chat.readonly ? <div className={css.sharedFooter}><p>{historyCopy.ownHint}</p><button type="button" onClick={chat.startOwn}>{historyCopy.startOwn}</button></div>
      : <GuideComposer chat={chat} />}
  </section>;
}
