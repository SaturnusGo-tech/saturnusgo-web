"use client";
import { ArrowLeft, ChartNoAxesCombined, Grid2X2, Layers3, Play, Plus, Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { widgetCatalog, type WidgetDefinition, type WidgetGroup } from "../../../../dashboards/layout/model/widget-catalog";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import styles from "./catalog.module.css";
import { WidgetEntry } from "./WidgetEntry";

const categories = [
  { key: "all", icon: Grid2X2 }, { key: "live", icon: Play },
  { key: "history", icon: ChartNoAxesCombined }, { key: "library", icon: Layers3 },
] as const;

export function WidgetCatalog({ dashboardName, selected, onAdd, onBack }: {
  dashboardName: string;
  selected: Set<string>;
  onAdd: (widgets: WidgetDefinition[]) => void;
  onBack: () => void;
}) {
  const { t } = useTmsLocale();
  const titleId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState<WidgetGroup | "all">("all");
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  const rows = widgetCatalog.filter((widget) => (group === "all" || widget.group === group) &&
    `${widget.ru} ${widget.en} ${widget.hintRu} ${widget.hintEn}`.toLowerCase().includes(search.trim().toLowerCase()));
  const missing = widgetCatalog.filter((widget) => !selected.has(widget.key));
  return <section className={styles.catalog} aria-labelledby={titleId}>
    <div className={styles.topbar}>
      <button type="button" className={styles.back} onClick={onBack} aria-label={`${t("dashboardLayout.back")}: ${dashboardName}`}>
        <ArrowLeft size={16} /><span>{dashboardName}</span>
      </button>
      <div className={styles.selection}>
        <span aria-live="polite">{t("dashboardLayout.selectedCount", { count: selected.size })}</span>
        <button type="button" className={styles.returnButton} onClick={onBack}>{t("dashboardLayout.back")}</button>
      </div>
    </div>
    <header className={styles.heading}>
      <h1 id={titleId} ref={heading} tabIndex={-1}>{t("dashboardLayout.catalog")}</h1>
      <p>{t("dashboardLayout.catalogHint")}</p>
    </header>
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <span className={styles.sidebarLabel}>{t("dashboardLayout.categories")}</span>
        <nav aria-label={t("dashboardLayout.categories")}>
          {categories.map(({ key, icon: Icon }) => <button type="button" key={key}
            aria-pressed={group === key} onClick={() => setGroup(key)}>
            <Icon size={15} aria-hidden="true" /><span>{t(`dashboardLayout.${key}`)}</span>
            <small>{key === "all" ? widgetCatalog.length : widgetCatalog.filter((widget) => widget.group === key).length}</small>
          </button>)}
        </nav>
        <button type="button" className={styles.addAll} disabled={!missing.length} onClick={() => onAdd(missing)}>
          <Plus size={14} />{t("dashboardLayout.addAll")}
        </button>
      </aside>
      <section className={styles.results} aria-label={t("dashboardLayout.all")}>
        <div className={styles.resultsHeading}>
          <h2>{t(`dashboardLayout.${group}`)}<span>{rows.length}</span></h2>
          <label className={styles.search}>
            <Search size={15} aria-hidden="true" />
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)}
              placeholder={t("dashboardLayout.search")} aria-label={t("dashboardLayout.search")} />
          </label>
        </div>
        <div className={styles.entries}>
          {rows.map((widget) => <WidgetEntry key={widget.key} widget={widget}
            added={selected.has(widget.key)} onAdd={() => onAdd([widget])} />)}
        </div>
        {!rows.length && <p className={styles.noResults}>{t("dashboardLayout.noMatches")}</p>}
      </section>
    </div>
  </section>;
}
