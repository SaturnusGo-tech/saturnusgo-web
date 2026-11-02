import { ArrowUpRight, Plus, ArrowRotateCcw, CloseBold } from "@openai/apps-sdk-ui/components/Icon";
import { useEffect, type KeyboardEvent } from "react";
import type { useGuideConversation } from "../state/useGuideConversation";
import type { useDocumentationNavigation } from "../../navigation/useDocumentationNavigation";
import { guideChatCopy } from "../localization/copy";
import { GuideMessage } from "./messages/GuideMessage";
import { GuideComposer } from "./composer/GuideComposer";
import { useConversationScroll } from "./scroll/useConversationScroll";
import css from "./guide-chat.module.css";
import { guideHistoryCopy } from "../history/localization/copy";
import { ChatHistorySidebar } from "../history/presentation/sidebar/ChatHistorySidebar";
import type { useHistoryDisclosure } from "../history/state/sidebar/useHistoryDisclosure";
import { useHistorySwipe } from "../history/state/sidebar/useHistorySwipe";

export function DocumentationChat({ chat, navigation, onSource, history }: {
  chat: ReturnType<typeof useGuideConversation>; navigation: ReturnType<typeof useDocumentationNavigation>; onSource: () => void;
  history: ReturnType<typeof useHistoryDisclosure>;
}) {
  const copy = guideChatCopy[chat.locale];
  const historyCopy = guideHistoryCopy[chat.locale];
  const historySwipe = useHistorySwipe(history.close);
  const { scroll, onScroll } = useConversationScroll(`${chat.messages.length}:${chat.partialText}:${chat.busy}`, chat.messages.length, chat.conversationId, chat.targetTurnId);
  useEffect(() => {
    if (!history.open || !history.narrow) return;
    const frame = requestAnimationFrame(() => document.querySelector<HTMLInputElement>('#falcon-ai-history input[type="search"]')?.focus());
    return () => cancelAnimationFrame(frame);
  }, [history.open, history.narrow]);
  function containHistoryFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (!history.narrow || event.key !== "Tab") return;
    const choices = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),a[href]')];
    const first = choices[0], last = choices[choices.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
  return <section className={css.chat} aria-label={copy.title} data-documentation-chat>
    <div ref={element => { if (element) element.inert = !history.open; }} className={css.historyPanel}
      data-open={history.open} onKeyDown={containHistoryFocus} {...historySwipe}>
      <ChatHistorySidebar chat={chat} active={history.open} onNavigate={history.afterNavigate} />
    </div>
    <button type="button" className={css.historyBackdrop} data-open={history.open} aria-label={historyCopy.close}
      aria-hidden={!history.open || !history.narrow} tabIndex={-1} onClick={() => history.close(true)} />
    <div ref={element => { if (element) element.inert = history.open && history.narrow; }} className={css.chatMain}>
    <div className={css.toolbar}>
      <span className={css.conversationTitle}>{chat.readonly ? historyCopy.shared : chat.title || "Falcon AI"}</span>
      <button type="button" className={`${css.iconButton} ${css.mobileNewChat}`} aria-label={copy.newChat} title={copy.newChat}
        onClick={chat.newChat} disabled={!chat.chatId && !chat.readonly && !chat.messages.length && !chat.draft && !chat.error}><Plus width={20} height={20} /></button>
    </div>
    <div className={css.conversationScroll} ref={scroll} onScroll={onScroll}>
      {chat.loadError ? <div className={css.empty}><p role="alert">{chat.readonly ? historyCopy.sharedMissing : historyCopy[chat.loadError]}</p>
        <button className={css.loadEarlier} type="button" onClick={chat.refresh}>{historyCopy.retry}</button></div>
        : chat.loading && !chat.messages.length ? <div className={css.empty}><p role="status">{historyCopy.loading}</p></div>
        : !chat.messages.length ? <div className={css.empty}>
        <h1>{copy.heading}</h1><p>{copy.introduction}</p>
        <div className={css.suggestions}>{copy.suggestions.map(question => <button key={question} type="button"
          disabled={!chat.enabled || chat.busy} onClick={() => void chat.send(question)}><span>{question}</span><ArrowUpRight width={17} height={17} aria-hidden="true" /></button>)}</div>
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
      <button type="button" onClick={chat.retry} disabled={!chat.enabled || !chat.draft.trim()}><ArrowRotateCcw width={16} height={16} />{copy.retry}</button>
      <button type="button" className={css.iconButton} onClick={chat.dismissError} aria-label={copy.dismiss}><CloseBold width={15} height={15} /></button>
    </div>}
    {chat.readonly ? <div className={css.sharedFooter}><p>{historyCopy.ownHint}</p><button type="button" onClick={chat.startOwn}>{historyCopy.startOwn}</button></div>
      : <GuideComposer chat={chat} />}
    </div>
  </section>;
}
