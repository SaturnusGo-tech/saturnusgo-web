import { ArrowRight, Check, ChevronDown, Info, Plus } from "lucide-react";
import { useId, useState, type ReactNode, type Ref } from "react";
import type { WidgetDefinition } from "../../../../../dashboards/layout/model/widget-catalog";
import { widgetSection } from "../../../../../dashboards/layout/sections/widget-sections";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import { catalogCopy, sectionLabel } from "../model/catalog-copy";
import { widgetDetails } from "../model/widget-details";
import { WidgetPreview } from "../preview/WidgetPreview";
import styles from "./details.module.css";

export function WidgetDetails({ panelRef, widget, projectName, added, onAdd, onSelectRelated, renderPreview }: {
  panelRef: Ref<HTMLElement>; widget: WidgetDefinition; projectName: string; added: boolean; onAdd: () => void;
  onSelectRelated: (key: string) => void; renderPreview?: (key: string) => ReactNode;
}) {
  const { locale } = useTmsLocale();
  const copy = catalogCopy(locale);
  const detail = widgetDetails(widget, locale);
  const [expanded, setExpanded] = useState(false);
  const titleId = useId();
  const contentsId = useId();
  return <aside ref={panelRef} className={styles.details} aria-labelledby={titleId}>
    <header><h2 id={titleId}>{locale === "ru" ? widget.ru : widget.en}</h2>
      <p>{copy.preview}<span aria-hidden="true"> · </span>{projectName}</p></header>
    <div className={styles.preview}><WidgetPreview widget={widget} renderPreview={renderPreview} /></div>
    <p className={styles.purpose}>{detail.purpose}</p>
    <div className={styles.section}><span>{copy.section}</span><strong>{sectionLabel(widgetSection(widget.key), locale)}</strong></div>
    {detail.included.length > 0 && <div className={styles.composition}>
      <button type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} aria-controls={contentsId}>
        <Info size={17} aria-hidden="true" /><span>{copy.includes}: {detail.included.length}</span>
        <ChevronDown size={15} aria-hidden="true" data-open={expanded} />
      </button>
      {expanded && <ul id={contentsId}>{detail.included.map((item) => <li key={item}>{item}</li>)}</ul>}
    </div>}
    <button type="button" className={styles.add} disabled={added} onClick={onAdd}>
      {added ? <Check size={19} aria-hidden="true" /> : <Plus size={20} aria-hidden="true" />}
      {added ? copy.alreadyAdded : copy.add}
    </button>
    <div className={styles.explanation}><h3>{copy.context}</h3><p>{detail.context}</p>
      <h3>{copy.overlap}</h3><p>{detail.overlap}</p></div>
    {detail.related.length > 0 && <div className={styles.related}><h3>{copy.related}</h3>
      <div>{detail.related.map((item) => <button type="button" key={item.key} onClick={() => onSelectRelated(item.key)}>
        {locale === "ru" ? item.ru : item.en}<ArrowRight size={15} aria-hidden="true" />
      </button>)}</div>
    </div>}
  </aside>;
}
