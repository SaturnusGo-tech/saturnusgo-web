import { ErrorToast } from "../../../presentation/common/error/ErrorToast";
import { useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { FolderAppearance } from "../../model/appearance/folder-appearance";
import type { KlipyAppearance } from "../model/klipy-types";
import { useAuthenticatedKlipyGallery } from "../state/useAuthenticatedKlipyGallery";
import css from "./gallery.module.css";

export function KlipyGallery({ ru, onChoose, selected }: {
  ru: boolean; onChoose: (value: KlipyAppearance) => void; selected?: FolderAppearance;
}) {
  const [query, setQuery] = useState("");
  const search = useRef<HTMLInputElement>(null);
  const gallery = useAuthenticatedKlipyGallery(query, ru ? "ru" : "en");
  const error = gallery.error?.kind === "rate"
    ? (ru ? "KLIPY занят. Повторите чуть позже." : "KLIPY is busy. Try again shortly.")
    : gallery.error?.kind === "access"
      ? (ru ? "KLIPY сейчас недоступен для этого приложения." : "KLIPY is unavailable for this app.")
      : (ru ? "Не удалось загрузить GIF." : "Could not load GIFs.");
  return <section className={css.gallery} aria-label={ru ? "GIF из KLIPY" : "KLIPY GIF gallery"}>
    <div className={css.search} data-input-shell><Search size={15} aria-hidden="true" />
      <input ref={search} type="search" placeholder="Search KLIPY" maxLength={200} value={query} disabled={!gallery.configured}
        aria-label={ru ? "Поиск GIF в KLIPY" : "Search GIFs on KLIPY"} onChange={event => setQuery(event.target.value)} />
      {query && <button type="button" className={css.clear} aria-label={ru ? "Очистить поиск GIF" : "Clear GIF search"}
        onClick={() => { setQuery(""); search.current?.focus(); }}><X size={14} aria-hidden="true" /></button>}
    </div>
    <a className={css.attribution} href="https://klipy.com" target="_blank" rel="noreferrer">Powered by KLIPY</a>
    {!gallery.configured ? <p role="status" className={css.message}>{ru ? "Галерея GIF пока недоступна." : "GIF gallery is not available yet."}</p>
      : <>
        {!!gallery.items.length && <div className={css.grid} aria-busy={gallery.loading}>
          {gallery.items.map((item, index) => <div key={`${item.appearance.id}:${index}`} className={css.item}>
            <button type="button" className={css.pick} aria-label={`${ru ? "Выбрать GIF" : "Use GIF"}: ${item.description || item.title}`}
              aria-pressed={selected?.kind === "gif" && selected.id === item.appearance.id && selected.url === item.appearance.url}
              onClick={() => { onChoose(item.appearance); gallery.share(item); }}>
              <img src={item.appearance.url} alt="" loading="lazy" decoding="async" referrerPolicy="strict-origin-when-cross-origin" />
            </button>
            <div className={css.credit}>{item.appearance.sourceUrl && <a href={item.appearance.sourceUrl} target="_blank" rel="noreferrer">{ru ? "Источник" : "Source"}</a>}
              {item.credit && <span>{item.credit}</span>}</div>
          </div>)}
        </div>}
        {gallery.loading && <p className={css.message} role="status">{ru ? "Загрузка GIF…" : "Loading GIFs…"}</p>}
        <ErrorToast message={gallery.error ? error : null} retryLabel={ru ? "Повторить" : "Retry"} onRetry={gallery.blockedUntil > 0 ? undefined : gallery.retry} />
        {!gallery.loading && !gallery.error && !gallery.items.length && <p className={css.message} role="status">{ru ? "Ничего не найдено." : "No GIFs found."}</p>}
        {!!gallery.next && !gallery.error && <button type="button" className={css.more} disabled={gallery.loading} onClick={gallery.more}>{ru ? "Ещё GIF" : "More GIFs"}</button>}
      </>}
  </section>;
}
