import { useState } from "react";
import { ChevronDown, Expand } from "lucide-react";
import { ScreenshotDialog } from "../../../presentation/walkthrough/ScreenshotDialog";
import { InlineText } from "../../../presentation/content/InlineText";
import { useDocumentationCopy } from "../../../localization/useDocumentationCopy";
import type { VisibleGuideVisual } from "../../model/visuals/visible-visuals";
import type { GuideChatCopy } from "../../localization/copy";
import css from "./guide-visuals.module.css";

export function GuideVisuals({ visual, copy }: { visual: VisibleGuideVisual; copy: GuideChatCopy }) {
  const [selected, setSelected] = useState<number | null>(null), [expanded, setExpanded] = useState(false);
  const docsCopy = useDocumentationCopy(), gallery = visual.layout === "gallery";
  const visible = gallery || expanded ? visual.steps : visual.steps.slice(0, 4);
  return <section className={css.visuals} data-layout={visual.layout} aria-label={`${copy.visuals}: ${visual.title}`}>
    <h3>{visual.title}</h3>
    <div className={gallery ? css.galleryScroll : undefined} role={gallery ? "region" : undefined}
      aria-label={gallery ? copy.gallery : undefined} tabIndex={gallery ? 0 : undefined}>
      <ol className={gallery ? css.gallery : css.steps}>
        {visible.map((step, index) => <li key={step.id}>
          <div className={css.stepCopy}><h4><span aria-hidden="true">{index + 1}</span>{step.title}</h4>
            <p><InlineText text={step.instruction} /></p>
            {!gallery && <p className={css.result}><InlineText text={step.result} /></p>}
          </div>
          <button type="button" className={css.thumbnail} onClick={() => setSelected(index)} aria-haspopup="dialog"
            aria-label={`${docsCopy.enlargeScreenshot} ${index + 1}: ${step.title}`}>
            <img src={step.image.src} alt={step.image.alt} width={step.image.width} height={step.image.height}
              loading="lazy" decoding="async" style={{ aspectRatio: `${step.image.width} / ${step.image.height}` }} />
            <span className={css.expand}><Expand size={13} aria-hidden="true" /></span>
          </button>
        </li>)}
      </ol>
    </div>
    {!gallery && visual.steps.length > 4 && <button type="button" className={css.more} aria-expanded={expanded}
      onClick={() => setExpanded(value => !value)}><ChevronDown size={14} aria-hidden="true" />
      {expanded ? copy.fewerSteps : `${copy.moreSteps} (${visual.steps.length - 4})`}</button>}
    <ScreenshotDialog steps={visual.steps} selected={selected} onSelect={setSelected} />
  </section>;
}
