import { Layers, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import styles from "../detail.module.css";
export function ComponentRail({ components, selected, onSelect }: {
  components: string[]; selected?: string; onSelect: (component?: string) => void;
}) {
  const { locale, t } = useTmsLocale(); const [search, setSearch] = useState("");
  const list = useRef<HTMLElement>(null);
  useEffect(() => { list.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest" }); }, [selected]);
  const all = locale === "ru" ? "Все компоненты" : "All components";
  return <aside className={styles.rail}><h2>{(locale === "ru" ? "Компоненты" : "Components")}</h2>
    <label className={styles.search} data-input-shell><Search size={14} /><input type="search" value={search}
      onChange={event => setSearch(event.target.value)} aria-label={locale === "ru" ? "Найти компонент" : "Find a component"} placeholder={locale === "ru" ? "Найти компонент" : "Find a component"} /></label>
    <nav ref={list} aria-label={(locale === "ru" ? "Компоненты" : "Components")}>
      <button type="button" aria-current={selected === undefined ? "page" : undefined} onClick={() => onSelect()}><Layers size={14} /><span>{all}</span></button>
      {components.filter(name => name.toLocaleLowerCase().includes(search.toLocaleLowerCase())).map(name => <button type="button" key={name}
        aria-current={selected === name ? "page" : undefined} onClick={() => onSelect(name)} title={name}><Layers size={14} /><span>{name || (locale === "ru" ? "Без компонента" : "No component")}</span></button>)}
    </nav>
  </aside>;
}
