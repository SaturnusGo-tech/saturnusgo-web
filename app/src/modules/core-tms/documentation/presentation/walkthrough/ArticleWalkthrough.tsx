import { useDocumentationCopy } from "../../localization/useDocumentationCopy";
import { useState } from "react";
import { Expand } from "lucide-react";
import type { WalkthroughBlock } from "../../model/visual/walkthrough";
import { InlineText } from "../content/InlineText";
import { ScreenshotDialog } from "./ScreenshotDialog";
import styles from "./walkthrough.module.css";

export function ArticleWalkthrough({ block }: { block: WalkthroughBlock }) {
  const copy = useDocumentationCopy();
  const [selected, setSelected] = useState<number | null>(null);
  return <div className={styles.root}>
    <p className={styles.intro}>{copy.walkthroughIntro}</p>
    <ol className={styles.sequence} aria-label={block.title}>
      {block.steps.map((step, index) => <li key={step.image.src} className={styles.step}>
        <div className={styles.heading}><span aria-hidden="true">{index + 1}</span><h3>{step.title}</h3></div>
        <p><InlineText text={step.instruction} /></p>
        <figure>
          <button type="button" className={styles.screenshot} onClick={() => setSelected(index)}
            aria-label={`${copy.enlargeScreenshot} ${index + 1}: ${step.title}`} aria-haspopup="dialog">
            <img src={step.image.src} alt={step.image.alt} width={step.image.width} height={step.image.height}
              loading="lazy" decoding="async" />
            <span className={styles.expand}><Expand size={15} aria-hidden="true" />{copy.enlarge}</span>
          </button>
          <figcaption><strong>{copy.result}</strong> <InlineText text={step.result} /></figcaption>
        </figure>
      </li>)}
    </ol>
    <ScreenshotDialog steps={block.steps} selected={selected} onSelect={setSelected} />
  </div>;
}
