import { Accordion, AccordionItem, Button } from "@heroui/react";
import { ArrowRight, Check, Info, Plus } from "lucide-react";
import { useId, type ReactNode, type Ref } from "react";
import type { WidgetDefinition } from "../../../../../dashboards/layout/model/widget-catalog";
import { widgetSection } from "../../../../../dashboards/layout/sections/widget-sections";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import { catalogCopy, sectionLabel } from "../model/catalog-copy";
import { widgetDetails } from "../model/widget-details";
import { WidgetPreview } from "../preview/WidgetPreview";
import styles from "./details.module.css";

export function WidgetDetails({ panelRef, widget, projectName, added, onAdd, onSelectRelated, relatedKeys, workflowPreview, renderPreview, addLabel, busy = false }: {
  panelRef: Ref<HTMLElement>; widget: WidgetDefinition; projectName: string; added: boolean; onAdd: () => void;
  onSelectRelated: (key: string) => void; renderPreview?: (key: string) => ReactNode; addLabel?: string; busy?: boolean;
  relatedKeys?: readonly string[]; workflowPreview?: boolean;
}) {
  const { locale } = useTmsLocale();
  const copy = catalogCopy(locale);
  const detail = widgetDetails(widget, locale, workflowPreview);
  const related = relatedKeys ? detail.related.filter(item => relatedKeys.includes(item.key)) : detail.related;
  const titleId = useId();
  return <aside ref={panelRef} className={styles.details} aria-labelledby={titleId}>
    <header><h2 id={titleId}>{locale === "ru" ? widget.ru : widget.en}</h2>
      <p>{copy.preview}{projectName && <><span aria-hidden="true"> · </span>{projectName}</>}</p></header>
    <div className={styles.preview}><WidgetPreview widget={widget} renderPreview={renderPreview} /></div>
    <p className={styles.purpose}>{detail.purpose}</p>
    <div className={styles.section}><span>{copy.section}</span><strong>{sectionLabel(widgetSection(widget.key), locale)}</strong></div>
    {detail.included.length > 0 && <Accordion className={styles.composition} variant="light" isCompact>
      <AccordionItem key="included" title={`${copy.includes}: ${detail.included.length}`} startContent={<Info size={16} aria-hidden="true" />}
        classNames={{ trigger: styles.compositionTrigger, title: styles.compositionTitle, content: styles.compositionContent }}>
        <ul>{detail.included.map((item) => <li key={item}>{item}</li>)}</ul>
      </AccordionItem>
    </Accordion>}
    <Button type="button" size="sm" variant="solid" disableRipple className={styles.add} data-added={added}
      isDisabled={added || busy} onPress={onAdd}>
      {added ? <Check size={19} aria-hidden="true" /> : <Plus size={20} aria-hidden="true" />}
      {added ? copy.alreadyAdded : addLabel ?? copy.add}
    </Button>
    <div className={styles.explanation}><h3>{copy.context}</h3><p>{detail.context}</p>
      <h3>{copy.overlap}</h3><p>{detail.overlap}</p></div>
    {related.length > 0 && <div className={styles.related}><h3>{copy.related}</h3>
      <div>{related.map((item) => <Button size="sm" variant="light" type="button" key={item.key} onPress={() => onSelectRelated(item.key)}>
        {locale === "ru" ? item.ru : item.en}<ArrowRight size={15} aria-hidden="true" />
      </Button>)}</div>
    </div>}
  </aside>;
}
