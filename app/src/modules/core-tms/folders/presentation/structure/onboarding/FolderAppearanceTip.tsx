import { useId } from "react";
import { PiFolderSimpleDuotone, PiX } from "react-icons/pi";
import css from "../structure.module.css";

export function FolderAppearanceTip({ ru, onDismiss }: { ru: boolean; onDismiss: () => void }) {
  const titleId = useId();
  return <aside className={css.appearanceTip} role="note" aria-labelledby={titleId} onKeyDown={event => {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); onDismiss(); }
  }}>
    <span className={css.tipPreview} aria-hidden="true"><PiFolderSimpleDuotone size={22} /></span>
    <div className={css.tipCopy}>
      <strong id={titleId}>{ru ? "Сделайте папки узнаваемыми" : "Make folders easy to spot"}</strong>
      <p>{ru ? "Нажмите на значок папки, чтобы выбрать цвет, иконку, эмодзи или GIF."
        : "Click a folder icon to choose a color, icon, emoji or GIF."}</p>
      <button type="button" className={css.tipDone} aria-label={ru ? "Понятно" : "Got it"} onClick={onDismiss}>{ru ? "Понятно" : "Got it"}</button>
    </div>
    <button type="button" className={css.tipClose} aria-label={ru ? "Закрыть подсказку" : "Dismiss tip"} onClick={onDismiss}><PiX size={13} aria-hidden="true" /></button>
  </aside>;
}
