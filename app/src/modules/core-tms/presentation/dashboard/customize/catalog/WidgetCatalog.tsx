"use client";
import { ArrowLeft, Bug, ChartNoAxesCombined, Grid2X2, Layers3, Play, Plus, Search } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { widgetCatalog, type WidgetDefinition } from "../../../../dashboards/layout/model/widget-catalog";
import { widgetSection, type DashboardSection } from "../../../../dashboards/layout/sections/widget-sections";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { WidgetDetails } from "./details/WidgetDetails";
import { catalogCopy, sectionLabel } from "./model/catalog-copy";
import styles from "./catalog.module.css";
import { WidgetEntry } from "./WidgetEntry";

const featured = ["queue", "defects", "trend", "coverage", "readyForRetest", "types", "freshness", "outcomes", "portfolio", "tags"];
const displayCatalog = [...widgetCatalog].sort((a, b) =>
  (featured.includes(a.key) ? featured.indexOf(a.key) : 99) - (featured.includes(b.key) ? featured.indexOf(b.key) : 99));
const categories = [
  { key: "all", icon: Grid2X2 }, { key: "overview", icon: Play },
  { key: "runs", icon: ChartNoAxesCombined }, { key: "defects", icon: Bug }, { key: "library", icon: Layers3 },
] as const;

export function WidgetCatalog({ dashboardName, projectName, selected, onAdd, onBack, renderPreview }: {
  dashboardName: string;
  projectName?: string;
  selected: Set<string>;
  onAdd: (widgets: WidgetDefinition[]) => void;
  onBack: () => void;
  renderPreview?: (key: string) => ReactNode;
}) {
  const { locale, t } = useTmsLocale();
  const copy = catalogCopy(locale);
  const titleId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const catalog = useRef<HTMLElement>(null);
  const detailPanel = useRef<HTMLElement>(null);
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState<DashboardSection | "all">("all");
  const [activeKey, setActiveKey] = useState("defects");
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  const rows = displayCatalog.filter((widget) => (group === "all" || widgetSection(widget.key) === group) &&
    `${widget.ru} ${widget.en} ${widget.hintRu} ${widget.hintEn} ${sectionLabel(widgetSection(widget.key), locale)}`
      .toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const active = rows.find((widget) => widget.key === activeKey) ?? rows[0];
  const missing = widgetCatalog.filter((widget) => !selected.has(widget.key));
  const addedCount = widgetCatalog.length - missing.length;
  const selectRelated = (key: string) => { setSearch(""); setGroup("all"); setActiveKey(key); };
  const selectWidget = (key: string) => {
    setActiveKey(key);
    if (catalog.current && catalog.current.clientWidth <= 710) requestAnimationFrame(() => {
      detailPanel.current?.scrollIntoView({ block: "start", behavior: "instant" });
    });
  };
  return <section ref={catalog} className={styles.catalog} aria-labelledby={titleId}>
    <div className={styles.topbar}>
      <button type="button" className={styles.back} onClick={onBack} title={dashboardName}>
        <ArrowLeft size={17} aria-hidden="true" /><span>{copy.back}</span>
      </button>
      <div className={styles.selection}>
        <span aria-live="polite">{copy.added} <strong>{addedCount}</strong></span>
        <button type="button" className={styles.returnButton} onClick={onBack}>{copy.done}</button>
      </div>
    </div>
    <header className={styles.heading}>
      <div><h1 id={titleId} ref={heading} tabIndex={-1}>{t("dashboardLayout.catalog")}</h1>
        <p>{copy.count(widgetCatalog.length)}</p></div>
      <label className={styles.search}>
        <Search size={17} aria-hidden="true" />
        <input type="search" value={search} onChange={(event) => setSearch(event.target.value)}
          placeholder={t("dashboardLayout.search")} aria-label={t("dashboardLayout.search")} />
      </label>
    </header>
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <nav aria-label={t("dashboardLayout.categories")}>
          {categories.map(({ key, icon: Icon }) => <button type="button" key={key}
            aria-pressed={group === key} onClick={() => setGroup(key)}>
            <Icon size={18} strokeWidth={1.7} aria-hidden="true" />
            <span>{key === "all" ? copy.all : sectionLabel(key, locale)}</span>
            <small>{key === "all" ? widgetCatalog.length : widgetCatalog.filter((widget) => widgetSection(widget.key) === key).length}</small>
          </button>)}
        </nav>
        <button type="button" className={styles.addAll} disabled={!missing.length} onClick={() => onAdd(missing)}>
          <Plus size={18} aria-hidden="true" /><span>{copy.addAll} {missing.length || ""}</span>
        </button>
      </aside>
      <section className={styles.results} aria-label={copy.all}>
        <div className={styles.resultsHeading}>
          <h2>{group === "all" ? copy.all : sectionLabel(group, locale)}</h2>
          {search.trim() && <span role="status">{copy.found}: {rows.length}</span>}
        </div>
        <div className={styles.entries}>
          {rows.map((widget) => <WidgetEntry key={widget.key} widget={widget} active={active?.key === widget.key}
            added={selected.has(widget.key)} onSelect={() => selectWidget(widget.key)}
            onAdd={() => onAdd([widget])} renderPreview={renderPreview} />)}
        </div>
        {!rows.length && <div className={styles.noResults}><Search size={26} aria-hidden="true" />
          <p>{t("dashboardLayout.noMatches")}</p>
          <button type="button" onClick={() => { setSearch(""); setGroup("all"); }}>{copy.clear}</button></div>}
      </section>
      {active && <WidgetDetails key={active.key} panelRef={detailPanel} widget={active} added={selected.has(active.key)}
        projectName={projectName ?? dashboardName} onAdd={() => onAdd([active])}
        onSelectRelated={selectRelated} renderPreview={renderPreview} />}
    </div>
  </section>;
}
