import { Braces, Link2, Trash2 } from "lucide-react";
import type { SharedStepSummary } from "../../../shared-steps/model/shared-step";
import css from "./catalog.module.css";

export function SharedStepList({ items, ru, locale, archiveEnabled, openingId, onOpen, onRemove }: {
  items: readonly SharedStepSummary[]; ru: boolean; locale: string; archiveEnabled: boolean;
  openingId: string | null; onOpen: (id: string) => void; onRemove: (item: SharedStepSummary) => void;
}) {
  const date = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });
  return <section aria-label={ru ? "Библиотека общих шагов" : "Shared step library"} className={css.catalog}>
    <div className={css.columns} aria-hidden="true"><span>{ru ? "Название" : "Name"}</span><span>{ru ? "Шаги" : "Steps"}</span>
      <span>{ru ? "В кейсах" : "Used in"}</span><span>{ru ? "Версия" : "Revision"}</span><span className={css.date}>{ru ? "Обновлён" : "Updated"}</span><span /></div>
    <ul className={css.list}>{items.map(item => <li key={item.id} className={css.row} data-shared-step-id={item.id}>
      <button type="button" className={css.open} aria-busy={openingId === item.id || undefined} aria-label={`${ru ? "Открыть общий шаг" : "Open shared step"}: ${item.title}`}
        onClick={() => onOpen(item.id)}>
        <span className={css.name}><Braces size={18} strokeWidth={1.5} aria-hidden="true" /><strong title={item.title}>{item.title}</strong></span>
        <span className={css.count}>{item.itemCount}<small>{ru ? " шагов" : " steps"}</small></span>
        <span className={css.usage} data-used={item.usageCount > 0 || undefined} title={ru ? "Тест-кейсов используют этот блок" : "Test cases using this block"}><Link2 size={13} aria-hidden="true" />{item.usageCount}</span>
        <span className={css.revision}>r{item.currentRevision}</span>
        <time className={css.date} dateTime={item.updatedAt} title={new Date(item.updatedAt).toLocaleString(locale)}>{date.format(new Date(item.updatedAt))}</time>
      </button>
      <button type="button" className={css.remove} disabled={!archiveEnabled} aria-label={ru ? `Удалить общий шаг «${item.title}»` : `Remove shared step “${item.title}”`}
        title={ru ? "Удалить общий шаг" : "Remove shared step"} onClick={() => onRemove(item)}><Trash2 size={15} strokeWidth={1.5} /></button>
    </li>)}</ul>
  </section>;
}
