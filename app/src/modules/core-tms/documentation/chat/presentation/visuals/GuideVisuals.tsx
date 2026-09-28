import { useRef, useState } from "react";
import { Expand } from "lucide-react";
import { ScreenshotDialog } from "../../../presentation/walkthrough/ScreenshotDialog";
import { InlineText } from "../../../presentation/content/InlineText";
import { useDocumentationCopy } from "../../../localization/useDocumentationCopy";
import type { VisibleGuideVisual } from "../../model/visuals/visible-visuals";
import type { GuideChatCopy } from "../../localization/copy";
import css from "./guide-visuals.module.css";

export function GuideVisuals({ visual, copy, startIndex = 0, screenshots = visual.steps }: {
  visual: VisibleGuideVisual; copy: GuideChatCopy; startIndex?: number; screenshots?: VisibleGuideVisual["steps"];
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const origin = useRef<HTMLButtonElement>(null);
  const docsCopy = useDocumentationCopy(), gallery = visual.layout === "gallery";
  return <section className={css.visuals} data-layout={visual.layout} aria-label={`${copy.visuals}: ${visual.title}`}>
    <h3>{visual.title}</h3>
    <div className={gallery ? css.galleryScroll : undefined} role={gallery ? "region" : undefined}
      aria-label={gallery ? copy.gallery : undefined} tabIndex={gallery ? 0 : undefined}>
      <ol className={gallery ? css.gallery : css.steps} start={startIndex + 1}>
        {visual.steps.map((step, index) => <li key={step.id}>
          <div className={css.stepCopy}><h4><span aria-hidden="true">{startIndex + index + 1}</span>{step.title}</h4>
            <p><InlineText text={step.instruction} /></p>
            {!gallery && <p className={css.result}><InlineText text={step.result} /></p>}
          </div>
          <button type="button" className={css.thumbnail} data-guide-image-index={startIndex + index}
            onClick={event => { origin.current = event.currentTarget; setSelected(startIndex + index); }} aria-haspopup="dialog"
            aria-label={`${docsCopy.enlargeScreenshot} ${startIndex + index + 1}: ${step.title}`}>
            <img src={step.image.src} alt={step.image.alt} width={step.image.width} height={step.image.height}
              loading="lazy" decoding="async" style={{ aspectRatio: `${step.image.width} / ${step.image.height}` }} />
            <span className={css.expand}><Expand size={13} aria-hidden="true" /></span>
          </button>
        </li>)}
      </ol>
    </div>
    <ScreenshotDialog steps={screenshots} selected={selected} onSelect={setSelected} originRef={origin} />
  </section>;
}
