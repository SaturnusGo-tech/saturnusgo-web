import { useEffect, useRef } from "react";
import { Archive, Check, MoreHorizontal, Pencil } from "lucide-react";
import type { GuideHistoryApi } from "../model/api";
import type { GuideChatSummary } from "../model/history";
import { guideHistoryCopy } from "../localization/copy";
import { useChatManagement } from "../application/manage/useChatManagement";
import css from "./history-popover.module.css";

export function HistoryItem({ item, api, locale, selected, onOpen, onChanged }: {
  item: GuideChatSummary; api: GuideHistoryApi; locale: "ru" | "en"; selected: boolean;
  onOpen(): void; onChanged(archived: boolean): void;
}) {
  const copy = guideHistoryCopy[locale], editor = useChatManagement(api, item, onChanged);
  const input = useRef<HTMLInputElement>(null), trigger = useRef<HTMLButtonElement>(null), controls = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (editor.mode === "rename") { input.current?.focus(); input.current?.select(); }
    else if (editor.mode) controls.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [editor.mode]);
  function close() { editor.close(); trigger.current?.focus(); }
  return <div className={css.item} onKeyDown={event => {
    if (editor.mode && event.key === "Escape") { event.preventDefault(); event.stopPropagation(); if (!editor.busy) close(); }
  }}>
    <div className={css.itemHeader}>
      <button type="button" data-chat-choice aria-current={selected ? "page" : undefined} className={css.row} onClick={onOpen}>
        <span><strong>{item.title || copy.untitled}</strong><time dateTime={item.updatedAt}>
          {new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(new Date(item.updatedAt))}</time></span>
        {selected && <Check size={14} aria-hidden="true" />}
      </button>
      <button ref={trigger} type="button" className={css.itemMore} aria-label={`${copy.actions}: ${item.title || copy.untitled}`}
        aria-expanded={Boolean(editor.mode)} disabled={editor.busy} onClick={() => editor.mode ? close() : editor.setMode("menu")}>
        <MoreHorizontal size={16} aria-hidden="true" />
      </button>
    </div>
    {editor.mode && <div ref={controls} className={css.itemControls} data-history-controls>
      {editor.mode === "menu" ? <div className={css.itemButtons}>
        <button type="button" onClick={() => editor.setMode("rename")}><Pencil size={13} />{copy.rename}</button>
        <button type="button" onClick={() => editor.setMode("archive")}><Archive size={13} />{copy.archive}</button>
      </div> : editor.mode === "rename" ? <form onSubmit={event => { event.preventDefault(); void editor.save(); }}>
        <input ref={input} aria-label={copy.title} maxLength={120} value={editor.title} disabled={editor.busy}
          onChange={event => editor.setTitle(event.target.value)} />
        <div className={css.itemButtons}><button type="submit" disabled={editor.busy || !editor.title.trim()}>{copy.save}</button>
          <button type="button" disabled={editor.busy} onClick={close}>{copy.cancel}</button></div>
      </form> : <><p>{copy.archiveConfirm}</p><div className={css.itemButtons}>
        <button type="button" disabled={editor.busy} onClick={() => void editor.save(true)}>{copy.archive}</button>
        <button type="button" disabled={editor.busy} onClick={close}>{copy.cancel}</button>
      </div></>}
      {editor.error && <p role="alert">{copy[editor.error]}</p>}
    </div>}
  </div>;
}
