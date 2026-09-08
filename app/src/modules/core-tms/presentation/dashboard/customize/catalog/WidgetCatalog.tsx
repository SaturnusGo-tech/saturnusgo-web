"use client";
import { createPortal } from "react-dom";
import surface from "../../dashboard.module.css";
import { Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { widgetCatalog, type WidgetDefinition, type WidgetGroup } from "../../../../dashboards/layout/model/widget-catalog";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import styles from "../layout.module.css";
import store from "./catalog.module.css";
import { WidgetCard } from "./WidgetCard";

export function WidgetCatalog({ selected, onAdd, onClose }: {
  selected: Set<string>; onAdd: (widgets: WidgetDefinition[]) => void; onClose: () => void;
}) {
  const { t } = useTmsLocale(); const reduced = useReducedMotion(); const id = useId();
  const ref = useRef<HTMLDivElement>(null); const [search, setSearch] = useState("");
  const [group, setGroup] = useState<WidgetGroup | "all">("all");
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLInputElement>("input")?.focus();
    return () => previous?.focus();
  }, []);
  const rows = widgetCatalog.filter((widget) => (group === "all" || widget.group === group) &&
    `${widget.ru} ${widget.en} ${widget.hintRu} ${widget.hintEn}`.toLowerCase().includes(search.trim().toLowerCase()));
  const missing = widgetCatalog.filter((widget) => !selected.has(widget.key));
  return createPortal(<div className={`${surface.page} ${styles.portal}`}><div className={store.backdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <motion.div ref={ref} role="dialog" aria-modal="true" aria-labelledby={id} className={store.catalog}
      initial={reduced ? false : { y: 14, scale: .985, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 14, scale: .985, opacity: 0 }} transition={{ duration: reduced ? 0 : .2 }}
      onKeyDown={(event) => {
        if (event.key === "Escape") { event.stopPropagation(); onClose(); }
        if (event.key !== "Tab") return;
        const elements = Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, [tabindex="0"]') ?? []);
        const first = elements[0]; const last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}>
      <header><div><span className={store.eyebrow}>FALCON / WIDGETS</span><h2 id={id}>{t("dashboardLayout.catalog")}</h2><p>{t("dashboardLayout.catalogHint")}</p></div>
        <button type="button" onClick={onClose} aria-label={t("dashboardLayout.close")}><X size={18} /></button></header>
      <div className={store.discovery}><label className={store.search}><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("dashboardLayout.search")} aria-label={t("dashboardLayout.search")} /></label>
      <div className={store.categories}>{(["all", "live", "history", "library"] as const).map((item) =>
        <button key={item} type="button" aria-pressed={group === item} onClick={() => setGroup(item)}>{t(`dashboardLayout.${item}`)}</button>)}</div></div>
      <div className={store.results}>
        <div className={store.resultsHeading}><strong>{t(group === "all" ? "dashboardLayout.all" : `dashboardLayout.${group}`)}</strong><span>{rows.length}</span></div>
        <div className={store.cards}>{rows.map((widget) => <WidgetCard key={widget.key} widget={widget} added={selected.has(widget.key)} onAdd={() => onAdd([widget])} />)}</div>
        {!rows.length && <p className={styles.noResults}>{t("dashboardLayout.noMatches")}</p>}
      </div>
      <footer><span>{selected.size} / {widgetCatalog.length}</span><button className={styles.primary} disabled={!missing.length} onClick={() => onAdd(missing)}>{t("dashboardLayout.addAll")}</button></footer>
    </motion.div>
  </div></div>, document.body);
}
