import { useCallback, useId, useRef, useState } from "react";
import { Check, Link, X } from "lucide-react";
import type { GuideHistoryApi } from "../../history/model/api";
import { useAnchoredPopup } from "../../../../presentation/common/popup/useAnchoredPopup";
import { guideHistoryCopy } from "../../history/localization/copy";
import { useGuideShare } from "../state/useGuideShare";
import css from "./share-answer.module.css";

export function ShareAnswer({ api, chatId, turnId, locale }: {
  api: GuideHistoryApi; chatId: string; turnId: string; locale: "ru" | "en";
}) {
  const copy = guideHistoryCopy[locale], id = useId(), [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null), panel = useRef<HTMLDivElement>(null);
  const dismiss = useCallback(() => setOpen(false), []), state = useGuideShare(api, chatId, turnId, open);
  useAnchoredPopup(open, false, root, trigger, panel, dismiss, 320);
  function close() { dismiss(); trigger.current?.focus({ preventScroll: true }); }
  return <div className={css.root} ref={root} onKeyDown={event => {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); }
  }} onBlur={event => { if (event.relatedTarget && !root.current?.contains(event.relatedTarget as Node)) dismiss(); }}>
    <button className={css.trigger} ref={trigger} type="button" aria-label={copy.share} title={copy.share}
      aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen(value => !value)}><Link size={14} aria-hidden="true" /></button>
    {open && <div className={css.panel} ref={panel} id={id} popover="manual" role="dialog" aria-labelledby={`${id}-title`}>
      <header><h2 id={`${id}-title`}>{copy.share}</h2><button type="button" onClick={close} aria-label={copy.closeShare}><X size={15} /></button></header>
      <p>{copy.shareScope}</p>
      {state.link && <input className={css.link} readOnly value={state.link} aria-label={copy.copyLink} onFocus={event => event.currentTarget.select()} />}
      <div className={css.actions}><button type="button" autoFocus disabled={state.busy} onClick={() => void state.copy()}>
        {state.status === "copied" ? <Check size={14} /> : <Link size={14} />}{state.busy ? copy.linking : state.status === "copied" ? copy.copied : copy.copyLink}</button>
        {state.share && <button type="button" disabled={state.busy} onClick={() => void state.revoke()}>{copy.revoke}</button>}</div>
      {state.status && state.status !== "copied" && <p className={css.status} role={state.status === "revoked" ? "status" : "alert"}>{copy[state.status]}</p>}
    </div>}
  </div>;
}
