import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Star, X } from "lucide-react";
import { useAnchoredPopup } from "../../../presentation/common/popup/useAnchoredPopup";
import { ResponsibleName } from "../../../workspace/members/presentation/ResponsibleName";
import type { useCaseMaintenance } from "../application/useCaseMaintenance";
import type { MaintenanceSource } from "../model/case-maintenance";
import css from "./maintenance.module.css";
export function MaintenanceControl({ state, workspaceId, ru, canManage, source }: {
  state: ReturnType<typeof useCaseMaintenance>; workspaceId: string; ru: boolean; canManage: boolean; source?: MaintenanceSource;
}) {
  const id = useId(), root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null), panel = useRef<HTMLDivElement>(null), closeButton = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false), [note, setNote] = useState("");
  const dismiss = useCallback(() => setOpen(false), []);
  useAnchoredPopup(open, false, root, trigger, panel, dismiss, 360);
  useEffect(() => { if (open) closeButton.current?.focus({ preventScroll: true }); }, [open]);
  const close = () => { dismiss(); trigger.current?.focus({ preventScroll: true }); };
  const flagged = state.projection?.status === "needs_update";
  const label = state.pending ? (ru ? "Сохраняем отметку…" : "Saving maintenance…") : flagged ? (ru ? "На доработке" : "Needs update")
    : ru ? "Отправить на доработку" : "Request update";
  const explanation = ru ? "Отметка относится к исходному тест-кейсу. Результат прогона и его снимок не меняются. Снимите отметку после обновления кейса."
    : "This marks the source test case. The run result and its snapshot stay unchanged. Clear the mark after updating the case.";
  const failure = state.error === "conflict" && !state.etag ? (ru ? "Отметку уже изменили. Не удалось загрузить актуальное состояние. Повторите загрузку." : "The mark changed elsewhere. Could not load the latest state. Reload before trying again.")
    : state.error === "conflict" ? (ru ? "Отметку уже изменили. Загружено актуальное состояние. Проверьте его и повторите действие." : "The mark changed elsewhere. Review the latest state and try again.")
    : state.error === "denied" ? (ru ? "Нет доступа к отметке. Проверьте права и повторите загрузку." : "Maintenance access is unavailable. Check permissions and reload.")
    : state.error === "read" ? (ru ? "Не удалось загрузить отметку. Повторите загрузку." : "Could not load maintenance. Retry loading.")
    : state.error === "write" ? (ru ? "Отметка не сохранена. Повторите действие." : "The mark was not saved. Try again.") : "";
  if (!source && !flagged && !state.pending && !state.error) return null;
  if (!flagged && !canManage && !state.error && !state.pending) return null;
  return <div ref={root} className={css.root} data-open={open || undefined} onKeyDown={event => {
    if (event.key === "Escape" && open && !event.defaultPrevented) { event.preventDefault(); event.stopPropagation(); close(); }
  }} onBlur={event => { if (event.relatedTarget && !root.current?.contains(event.relatedTarget as Node)) dismiss(); }}>
    <button ref={trigger} type="button" className={css.trigger} data-flagged={flagged || undefined} aria-label={label}
      aria-describedby={`${id}-hint`} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen(value => !value)}>
      <Star size={15} fill={flagged ? "currentColor" : "none"} aria-hidden="true" /><span>{label}</span>
    </button>
    <span id={`${id}-hint`} role="tooltip" className={css.tooltip}>{explanation}</span>
    {open && <div ref={panel} id={id} popover="manual" role="dialog" className={css.panel} aria-labelledby={`${id}-title`} aria-busy={state.pending}>
      <header className={css.header}><h2 id={`${id}-title`}>{flagged ? (ru ? "На доработке" : "Needs update") : (ru ? "Доработка тест-кейса" : "Test case maintenance")}</h2>
        <button ref={closeButton} type="button" onClick={close} aria-label={ru ? "Закрыть доработку" : "Close maintenance"}><X size={16} aria-hidden="true" /></button></header>
      <p className={css.hint}>{explanation}</p>
      {state.projection?.updatedBy && <div className={css.provenance}><ResponsibleName workspaceId={workspaceId} identityId={state.projection.updatedBy} />
        {state.projection.updatedAt && <time dateTime={state.projection.updatedAt}>{new Date(state.projection.updatedAt).toLocaleString(ru ? "ru" : "en", { dateStyle: "medium", timeStyle: "short" })}</time>}</div>}
      {state.projection?.note && <p className={css.note}>{state.projection.note}</p>}
      {state.loading && <p role="status" className={css.hint}>{ru ? "Загружаем отметку…" : "Loading maintenance…"}</p>}
      {failure && <div className={css.error} role="alert"><span>{failure}</span>
        <button type="button" disabled={state.pending} onClick={state.refresh}>{ru ? "Обновить" : "Reload"}</button></div>}
      {canManage && (flagged || source) && <form className={css.form} onSubmit={async event => {
        event.preventDefault(); if (state.pending || state.loading || !state.etag) return;
        const returnTarget = root.current?.closest("header")?.querySelector<HTMLButtonElement>("button:not(:disabled)");
        const reason = note.trim() ? { note: note.trim() } : {};
        const ok = await state.change(flagged ? { status: "current", ...reason } : { status: "needs_update", source: source!, ...reason });
        if (ok) { setNote(""); close(); if (!trigger.current?.isConnected && returnTarget?.isConnected) returnTarget.focus({ preventScroll: true }); }
      }}>
        <label>{ru ? "Комментарий (необязательно)" : "Comment (optional)"}<textarea rows={2} maxLength={2000} value={note} disabled={state.pending} onChange={event => setNote(event.target.value)} /></label>
        <button type="submit" disabled={state.pending || state.loading || !state.etag}>{state.pending ? (ru ? "Сохраняем…" : "Saving…")
          : flagged ? (ru ? "Снять отметку" : "Clear mark") : (ru ? "Отправить на доработку" : "Request update")}</button>
      </form>}
    </div>}
  </div>;
}
