import { ArrowUpRight, Plus, RotateCcw, X } from "lucide-react";
import type { useGuideConversation } from "../state/useGuideConversation";
import type { useDocumentationNavigation } from "../../navigation/useDocumentationNavigation";
import { guideChatCopy } from "../localization/copy";
import { GuideMessage } from "./messages/GuideMessage";
import { GuideComposer } from "./composer/GuideComposer";
import { useConversationScroll } from "./scroll/useConversationScroll";
import css from "./guide-chat.module.css";

export function DocumentationChat({ chat, navigation, onSource }: {
  chat: ReturnType<typeof useGuideConversation>; navigation: ReturnType<typeof useDocumentationNavigation>; onSource: () => void;
}) {
  const copy = guideChatCopy[chat.locale];
  const { scroll, onScroll } = useConversationScroll(`${chat.messages.length}:${chat.partialText}:${chat.busy}`, chat.messages.length, chat.conversationId);
  return <section className={css.chat} aria-label={copy.title} data-documentation-chat>
    <div className={css.toolbar}>
      <button type="button" className={css.iconButton} aria-label={copy.newChat} title={copy.newChat}
        onClick={chat.newChat} disabled={!chat.messages.length && !chat.draft && !chat.error}><Plus size={18} /></button>
    </div>
    <div className={css.conversationScroll} ref={scroll} onScroll={onScroll}>
      {!chat.messages.length ? <div className={css.empty}>
        <h1>{copy.heading}</h1><p>{copy.introduction}</p>
        <div className={css.suggestions}>{copy.suggestions.map(question => <button key={question} type="button"
          disabled={!chat.enabled || chat.busy} onClick={() => chat.setDraft(question)}><span>{question}</span><ArrowUpRight size={15} aria-hidden="true" /></button>)}</div>
      </div> : <div className={css.conversation} role="log" aria-label={copy.conversation} aria-live="polite" aria-relevant="additions">
        {chat.messages.map((message, index) => <GuideMessage key={`${chat.conversationId}:${index}`} message={message} navigation={navigation} onSource={onSource} />)}
        {chat.busy && chat.partialText && <GuideMessage message={{ role: "assistant", content: chat.partialText }} navigation={navigation} onSource={onSource} streaming />}
        {chat.busy && !chat.partialText && <div className={css.preparing} role="status"><span className={css.pulse} />{copy.preparing}</div>}
      </div>}
    </div>
    {chat.error && <div className={css.error} role="alert"><p>{copy[chat.error]}</p>
      <button type="button" onClick={chat.retry} disabled={!chat.enabled || !chat.draft.trim()}><RotateCcw size={14} />{copy.retry}</button>
      <button type="button" className={css.iconButton} onClick={chat.dismissError} aria-label={copy.dismiss}><X size={15} /></button>
    </div>}
    <GuideComposer chat={chat} />
  </section>;
}
