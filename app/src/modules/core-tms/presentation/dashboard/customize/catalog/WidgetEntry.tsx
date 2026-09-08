import { Check, Plus } from "lucide-react";
import type { ReactNode } from "react";
import type { WidgetDefinition } from "../../../../dashboards/layout/model/widget-catalog";
import { widgetSection } from "../../../../dashboards/layout/sections/widget-sections";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { catalogCopy, sectionLabel } from "./model/catalog-copy";
import { WidgetPreview } from "./preview/WidgetPreview";
import styles from "./catalog.module.css";

export function WidgetEntry({ widget, added, active, onAdd, onSelect, renderPreview }: {
  widget: WidgetDefinition; added: boolean; active: boolean; onAdd: () => void; onSelect: () => void;
  renderPreview?: (key: string) => ReactNode;
}) {
  const { locale, t } = useTmsLocale();
  const copy = catalogCopy(locale);
  const title = locale === "ru" ? widget.ru : widget.en;
  return <article className={styles.entry} data-selected={active}>
    <div className={styles.thumbnail}>
      <WidgetPreview widget={widget} compact renderPreview={renderPreview} />
    </div>
    <div className={styles.description}>
      <h3>{title}</h3><p>{locale === "ru" ? widget.hintRu : widget.hintEn}</p>
      <span className={styles.badge}>{sectionLabel(widgetSection(widget.key), locale)}</span>
    </div>
    <button type="button" className={styles.selectEntry} onClick={onSelect} aria-pressed={active}
      aria-label={`${copy.preview}: ${title}`} />
    <button className={styles.install} type="button" disabled={added} onClick={onAdd}
      aria-label={`${added ? t("dashboardLayout.added") : t("dashboardLayout.add")}: ${title}`}>
      {added ? <Check size={17} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
      <span>{t(added ? "dashboardLayout.added" : "dashboardLayout.install")}</span>
    </button>
  </article>;
}
