import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { sectionLabels, type DashboardSection } from "../../../../dashboards/layout/sections/widget-sections";
import styles from "../layout.module.css";
export function SectionNavigation({ sections, selected, onSelect }: {
  sections: DashboardSection[]; selected: DashboardSection | "all"; onSelect: (section: DashboardSection | "all") => void;
}) {
  const { locale } = useTmsLocale();
  return <nav className={styles.sectionNavigation} aria-label={locale === "ru" ? "Разделы дашборда" : "Dashboard sections"}>
    {sections.map(section => <button key={section} type="button" aria-current={selected === section ? "page" : undefined}
      onClick={() => onSelect(section)}>{sectionLabels[section][locale === "ru" ? "ru" : "en"]}</button>)}
    {sections.length > 1 && <button type="button" aria-current={selected === "all" ? "page" : undefined} onClick={() => onSelect("all")}>{locale === "ru" ? "Все разделы" : "All sections"}</button>}
  </nav>;
}
