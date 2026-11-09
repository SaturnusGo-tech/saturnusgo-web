"use client";
import { Button, Input } from "@heroui/react";
import { addToast } from "@heroui/toast";
import { ArrowLeft, Bug, ChartNoAxesCombined, Grid2X2, Layers3, Play, Plus, Search } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { dashboardcnEnabled, widgetCatalog, type WidgetDefinition } from "../../../../dashboards/layout/model/widget-catalog";
import { workflowCatalog } from "../../../../dashboards/layout/migration/workflow-widgets";
import { widgetSection, type DashboardSection } from "../../../../dashboards/layout/sections/widget-sections";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { DashboardSegments, dashboardTabId } from "../../common/segments/DashboardSegments";
import { WidgetDetails } from "./details/WidgetDetails";
import { catalogCopy, sectionLabel } from "./model/catalog-copy";
import styles from "./catalog.module.css";
import { WidgetEntry } from "./WidgetEntry";

const featured = ["queue", "defects", "trend", "coverage", "readyForRetest", "types", "freshness", "outcomes", "portfolio", "tags"];
const sortCatalog = (catalog: readonly WidgetDefinition[]) => [...catalog].sort((a, b) =>
  (featured.includes(a.key) ? featured.indexOf(a.key) : 99) - (featured.includes(b.key) ? featured.indexOf(b.key) : 99));
const documentCatalog = sortCatalog(widgetCatalog);
const previewBoardCatalog = sortCatalog(workflowCatalog);
const categories = [
  { key: "all", icon: Grid2X2 }, { key: "overview", icon: Play },
  { key: "runs", icon: ChartNoAxesCombined }, { key: "defects", icon: Bug }, { key: "library", icon: Layers3 },
] as const;

export function WidgetCatalog({ dashboardName, projectName, selected, onAdd, onBack, renderPreview, documentInsert }: {
  dashboardName: string;
  projectName?: string;
  selected: Set<string>;
  onAdd: (widgets: WidgetDefinition[]) => boolean | void;
  onBack: () => void;
  renderPreview?: (key: string) => ReactNode;
  documentInsert?: { label: string; busy: boolean };
}) {
  const { locale, t } = useTmsLocale();
  const copy = catalogCopy(locale);
  const titleId = useId();
  const resultsId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const catalog = useRef<HTMLElement>(null);
  const detailPanel = useRef<HTMLElement>(null);
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState<DashboardSection | "all">("all");
  const [activeKey, setActiveKey] = useState("defects");
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  const workflowPreview = !documentInsert && dashboardcnEnabled();
  const available = workflowPreview ? previewBoardCatalog : documentCatalog;
  const rows = available.filter((widget) => (group === "all" || widgetSection(widget.key) === group) &&
    `${widget.ru} ${widget.en} ${widget.hintRu} ${widget.hintEn} ${sectionLabel(widgetSection(widget.key), locale)}`
      .toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const active = rows.find((widget) => widget.key === activeKey) ?? rows[0];
  const missing = available.filter((widget) => !selected.has(widget.key));
  const addedCount = available.length - missing.length;
  const addAll = () => {
    if (!missing.length || onAdd(missing) === false) return;
    addToast({ title: copy.bulkAdded, description: copy.bulkSaveHint, severity: "success" });
  };
  const selectRelated = (key: string) => { setSearch(""); setGroup("all"); setActiveKey(key); };
  const selectWidget = (key: string) => {
    setActiveKey(key);
    if (catalog.current && catalog.current.clientWidth <= 710) requestAnimationFrame(() => {
      detailPanel.current?.scrollIntoView({ block: "start", behavior: "instant" });
    });
  };
  return <section ref={catalog} className={styles.catalog} data-document-insert={Boolean(documentInsert)} aria-labelledby={titleId}>
    {!documentInsert && <div className={styles.topbar}>
      <Button type="button" size="sm" variant="light" className={styles.back} onPress={onBack} title={dashboardName}>
        <ArrowLeft size={17} aria-hidden="true" /><span>{copy.back}</span>
      </Button>
      <div className={styles.selection}>
        <span aria-live="polite">{copy.added} <strong>{addedCount}</strong></span>
        <Button type="button" size="sm" variant="solid" className={styles.returnButton} onPress={onBack}>{copy.done}</Button>
      </div>
    </div>}
    <header className={styles.heading}>
      {documentInsert ? <p id={titleId}>{copy.count(available.length)}</p>
        : <div><h1 id={titleId} ref={heading} tabIndex={-1}>{t("dashboardLayout.catalog")}</h1>
          <p>{copy.count(available.length)}</p></div>}
      <Input type="search" size="sm" variant="flat" value={search} onValueChange={setSearch}
        data-autofocus={documentInsert ? "" : undefined} isClearable onClear={() => setSearch("")}
        startContent={<Search size={16} aria-hidden="true" />}
        classNames={{ base: styles.search, inputWrapper: styles.searchWrapper, innerWrapper: styles.searchInner, input: styles.searchInput }}
        placeholder={t("dashboardLayout.search")} aria-label={t("dashboardLayout.search")} />
    </header>
    <div className={styles.categories}>
      <DashboardSegments<DashboardSection | "all"> label={t("dashboardLayout.categories")} panelId={resultsId}
        selectedKey={group} onSelect={setGroup} listClassName={styles.categoryTabs} tabClassName={styles.categoryTab}
        items={categories.map(({ key, icon: Icon }) => ({
          key,
          icon: <Icon size={15} strokeWidth={1.7} aria-hidden="true" />,
          label: key === "all" ? copy.all : sectionLabel(key, locale),
        }))} />
      {!documentInsert && <Button size="sm" variant="light" className={styles.addAll} isDisabled={!missing.length} onPress={addAll}>
        <Plus size={16} aria-hidden="true" />{copy.addAll}{missing.length > 0 ? ` ${missing.length}` : ""}
      </Button>}
    </div>
    <div className={styles.layout}>
      <section className={styles.results} role="tabpanel" id={resultsId} aria-labelledby={dashboardTabId(resultsId, group)}>
        <div className={styles.resultsHeading}>
          <h2>{group === "all" ? copy.all : sectionLabel(group, locale)}</h2>
          {search.trim() && <span role="status">{copy.found}: {rows.length}</span>}
        </div>
        <div className={styles.entries}>
          {rows.map((widget) => <WidgetEntry key={widget.key} widget={widget} active={active?.key === widget.key}
            added={selected.has(widget.key)} addLabel={documentInsert?.label} busy={documentInsert?.busy} onSelect={() => selectWidget(widget.key)}
            onAdd={() => onAdd([widget])} renderPreview={renderPreview} />)}
        </div>
        {!rows.length && <div className={styles.noResults}><Search size={26} aria-hidden="true" />
          <p>{t("dashboardLayout.noMatches")}</p>
          <Button size="sm" variant="light" onPress={() => { setSearch(""); setGroup("all"); }}>{copy.clear}</Button></div>}
      </section>
      {active && <WidgetDetails key={active.key} panelRef={detailPanel} widget={active} added={selected.has(active.key)} addLabel={documentInsert?.label} busy={documentInsert?.busy}
        projectName={projectName ?? dashboardName} onAdd={() => onAdd([active])}
        onSelectRelated={selectRelated} workflowPreview={workflowPreview} relatedKeys={available.map(widget => widget.key)} renderPreview={renderPreview} />}
    </div>
  </section>;
}
