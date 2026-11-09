import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { sectionLabels, type DashboardSection } from "../../../../dashboards/layout/sections/widget-sections";
import { DashboardSegments } from "../../common/segments/DashboardSegments";
import styles from "../layout.module.css";
export function SectionNavigation({ sections, selected, onSelect, panelId }: {
  sections: DashboardSection[]; panelId?: string; selected: DashboardSection | "all"; onSelect: (section: DashboardSection | "all") => void;
}) {
  const { locale } = useTmsLocale();
  const label = locale === "ru" ? "Разделы дашборда" : "Dashboard sections";
  const allLabel = locale === "ru" ? "Все разделы" : "All sections";
  if (panelId) return <DashboardSegments<DashboardSection | "all"> label={label} panelId={panelId}
    selectedKey={selected} onSelect={onSelect} listClassName={styles.workflowTabs} tabClassName={styles.workflowTab}
    items={[...(sections.length > 1 ? [{ key: "all" as const, label: allLabel }] : []),
      ...sections.map(key => ({ key, label: key === "overview" ? locale === "ru" ? "Триаж" : "Triage" : sectionLabels[key][locale] }))]} />;
  return <nav className={styles.sectionNavigation} aria-label={label}>
    {sections.map(section => <button key={section} type="button" aria-current={selected === section ? "page" : undefined}
      onClick={() => onSelect(section)}>{sectionLabels[section][locale === "ru" ? "ru" : "en"]}</button>)}
    {sections.length > 1 && <button type="button" aria-current={selected === "all" ? "page" : undefined} onClick={() => onSelect("all")}>{allLabel}</button>}
  </nav>;
}
