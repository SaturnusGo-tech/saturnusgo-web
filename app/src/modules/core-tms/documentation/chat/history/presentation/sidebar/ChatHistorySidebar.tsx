import { useRef } from "react";
import { ComposeEditSquare, MagnifyingGlassSearch } from "@openai/apps-sdk-ui/components/Icon";
import type { useGuideConversation } from "../../../state/useGuideConversation";
import { useChatHistory } from "../../state/useChatHistory";
import { guideHistoryCopy } from "../../localization/copy";
import { guideChatCopy } from "../../../localization/copy";
import { HistoryItem } from "../HistoryItem";
import { useSidebarVisibility } from "./useSidebarVisibility";
import css from "./history-sidebar.module.css";

export function ChatHistorySidebar({ chat, active = true, onNavigate }: {
  chat: ReturnType<typeof useGuideConversation>; active?: boolean; onNavigate?: () => void;
}) {
  const copy = guideHistoryCopy[chat.locale], chatCopy = guideChatCopy[chat.locale];
  const sidebar = useRef<HTMLElement>(null), visible = useSidebarVisibility(sidebar);
  const history = useChatHistory(chat.api, chat.owner, chat.historyRevision, active && visible);
  return <aside id="falcon-ai-history" ref={sidebar} className={css.sidebar} aria-label={copy.history}>
    <div className={css.identity}>Falcon AI</div>
    <button type="button" className={css.newChat} onClick={() => { chat.newChat(); onNavigate?.(); }}>
      <ComposeEditSquare width={20} height={20} aria-hidden="true" /><span>{chatCopy.newChat}</span>
    </button>
    <label className={css.search}>
      <MagnifyingGlassSearch width={19} height={19} aria-hidden="true" />
      <input type="search" value={history.query} maxLength={120} placeholder={copy.search} aria-label={copy.search}
        onChange={event => history.setQuery(event.target.value)} />
    </label>
    <h2 className={css.heading}>{copy.history}</h2>
    <div className={css.list} aria-busy={history.loading}>
      {chat.api && history.items.map(item => <HistoryItem key={item.id} item={item} api={chat.api!} locale={chat.locale}
        selected={item.id === chat.chatId} onOpen={() => { chat.selectChat(item.id); onNavigate?.(); }}
        onChanged={archived => {
          chat.refreshHistory();
          if (item.id === chat.chatId) { if (archived) chat.newChat(); else chat.refresh(); }
        }} />)}
      {!history.items.length && <p className={css.status} role="status">{history.loading ? copy.loading
        : history.error ? copy.unavailable : history.query ? copy.noResults : copy.empty}</p>}
      {history.error && <button className={css.more} type="button" onClick={history.retry}>{copy.retry}</button>}
      {history.cursor && <button className={css.more} type="button" disabled={history.loading} onClick={history.more}>{copy.loadMore}</button>}
    </div>
  </aside>;
}
