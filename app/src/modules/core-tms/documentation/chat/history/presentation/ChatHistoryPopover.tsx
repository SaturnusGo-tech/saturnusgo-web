import { useCallback, useEffect, useId, useRef, useState } from "react";
import { History, Search, X } from "lucide-react";
import type { useGuideConversation } from "../../state/useGuideConversation";
import { useAnchoredPopup } from "../../../../presentation/common/popup/useAnchoredPopup";
import { useChatHistory } from "../state/useChatHistory";
import { guideHistoryCopy } from "../localization/copy";
import { HistoryItem } from "./HistoryItem";
import css from "./history-popover.module.css";

export function ChatHistoryPopover({ chat }: { chat: ReturnType<typeof useGuideConversation> }) {
  const copy = guideHistoryCopy[chat.locale], id = useId(), api = chat.api;
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null), panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null), close = useCallback(() => setOpen(false), []);
  const history = useChatHistory(chat.api, chat.owner, chat.historyRevision, open);
  useAnchoredPopup(open, false, root, trigger, panel, close, 320);
  useEffect(() => { if (open) input.current?.focus({ preventScroll: true }); }, [open]);
  function dismiss() { close(); trigger.current?.focus({ preventScroll: true }); }
  return <div className={css.root} ref={root} onKeyDown={event => {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); dismiss(); }
    if (open && !(event.target as HTMLElement).closest("[data-history-controls]") && ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)
      && (event.target !== input.current || event.key.startsWith("Arrow"))) {
      const items = [...panel.current!.querySelectorAll<HTMLButtonElement>("[data-chat-choice]")];
      if (!items.length) return;
      event.preventDefault(); const index = items.indexOf(document.activeElement as HTMLButtonElement);
      items[event.key === "Home" ? 0 : event.key === "End" ? items.length - 1
        : (index + (event.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]?.focus();
    }
  }} onBlur={event => { if (event.relatedTarget && !root.current?.contains(event.relatedTarget as Node)) close(); }}>
    <button type="button" className={css.trigger} ref={trigger} onClick={() => setOpen(value => !value)}
      aria-label={copy.history} title={copy.history} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id : undefined}>
      <History size={18} aria-hidden="true" />
    </button>
    {open && <div ref={panel} id={id} popover="manual" role="dialog" aria-labelledby={`${id}-title`} className={css.panel}>
      <header><h2 id={`${id}-title`}>{copy.history}</h2><button type="button" onClick={dismiss} aria-label={copy.close}><X size={15} /></button></header>
      <label className={css.search}><Search size={14} aria-hidden="true" /><input ref={input} value={history.query} maxLength={120}
        onChange={event => history.setQuery(event.target.value)} placeholder={copy.search} aria-label={copy.search} /></label>
      <div className={css.list} aria-busy={history.loading}>
        {api && history.items.map(item => <HistoryItem key={item.id} item={item} api={api} locale={chat.locale}
          selected={item.id === chat.chatId} onOpen={() => { close(); chat.selectChat(item.id); }}
          onChanged={archived => {
            chat.refreshHistory();
            if (item.id === chat.chatId) { if (archived) chat.newChat(); else chat.refresh(); }
          }} />)}
        {!history.items.length && <p className={css.status} role="status">{history.loading ? copy.loading
          : history.error ? copy.unavailable : history.query ? copy.noResults : copy.empty}</p>}
        {history.error && <button className={css.more} type="button" onClick={history.retry}>{copy.retry}</button>}
        {history.cursor && <button className={css.more} type="button" disabled={history.loading} onClick={history.more}>{copy.loadMore}</button>}
      </div>
    </div>}
  </div>;
}
