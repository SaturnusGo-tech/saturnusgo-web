import { useDocumentationCopy } from "../../localization/useDocumentationCopy";
import { useId, useRef, type RefObject } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import type { ScreenshotStep } from "../../model/visual/walkthrough";
import { InlineText } from "../content/InlineText";
import styles from "./walkthrough.module.css";
import { useScreenshotMotion } from "./motion/useScreenshotMotion";

export function ScreenshotDialog({ steps, selected, onSelect, originRef }: {
  steps: ScreenshotStep[];
  selected: number | null;
  onSelect: (value: number | null) => void;
  originRef?: RefObject<HTMLButtonElement | null>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const image = useRef<HTMLImageElement>(null);
  const copy = useDocumentationCopy();
  const titleId = useId();
  const descriptionId = useId();
  const step = selected === null ? null : steps[selected];
  const motion = useScreenshotMotion(dialog, image, originRef, selected, onSelect);
  return <dialog ref={dialog} className={styles.dialog} aria-labelledby={titleId} aria-describedby={descriptionId}
    onCancel={event => { event.preventDefault(); motion.close(); }} onClose={motion.closed}
    onClick={(event) => { if (event.target === event.currentTarget) motion.close(); }}
    onKeyDown={(event) => {
      if (selected === null) return;
      if (event.key === "ArrowLeft" && selected > 0) { event.preventDefault(); motion.select(selected - 1); }
      if (event.key === "ArrowRight" && selected < steps.length - 1) { event.preventDefault(); motion.select(selected + 1); }
    }}>
    {step && selected !== null && <div className={styles.viewer} data-screenshot-surface>
      <header><div><span>{copy.step} {selected + 1} {copy.of} {steps.length}</span><h2 id={titleId}>{step.title}</h2></div>
        <button type="button" onClick={motion.close} aria-label={copy.closeScreenshot} autoFocus><X size={20} /></button>
      </header>
      <div className={styles.imageScroll} role="region" tabIndex={0} aria-label={copy.screenshotRegion}>
        <img ref={image} key={step.image.src} src={step.image.src} alt={step.image.alt} width={step.image.width} height={step.image.height} />
      </div>
      <span className={styles.panHint}>{copy.panHint}</span>
      <footer><p id={descriptionId}><InlineText text={step.result} /></p><nav aria-label={copy.walkthroughSteps}>
        <button type="button" disabled={selected === 0} onClick={() => motion.select(selected - 1)} aria-label={copy.previousScreenshot}><ArrowLeft size={18} /></button>
        <button type="button" disabled={selected === steps.length - 1} onClick={() => motion.select(selected + 1)} aria-label={copy.nextScreenshot}><ArrowRight size={18} /></button>
      </nav></footer>
    </div>}
  </dialog>;
}
