import { useEffect, useId, useRef } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import type { ScreenshotStep } from "../../model/visual/walkthrough";
import { InlineText } from "../content/InlineText";
import styles from "./walkthrough.module.css";

export function ScreenshotDialog({ steps, selected, onSelect }: {
  steps: ScreenshotStep[];
  selected: number | null;
  onSelect: (value: number | null) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const step = selected === null ? null : steps[selected];
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (selected !== null && !element.open) element.showModal();
    if (selected === null && element.open) element.close();
  }, [selected]);
  return <dialog ref={dialog} className={styles.dialog} aria-labelledby={titleId} aria-describedby={descriptionId}
    onCancel={() => onSelect(null)} onClose={() => onSelect(null)}
    onClick={(event) => { if (event.target === event.currentTarget) onSelect(null); }}
    onKeyDown={(event) => {
      if (selected === null) return;
      if (event.key === "ArrowLeft" && selected > 0) { event.preventDefault(); onSelect(selected - 1); }
      if (event.key === "ArrowRight" && selected < steps.length - 1) { event.preventDefault(); onSelect(selected + 1); }
    }}>
    {step && selected !== null && <div className={styles.viewer}>
      <header><div><span>Шаг {selected + 1} из {steps.length}</span><h2 id={titleId}>{step.title}</h2></div>
        <button type="button" onClick={() => onSelect(null)} aria-label="Закрыть снимок" autoFocus><X size={20} /></button>
      </header>
      <div className={styles.imageScroll} role="region" tabIndex={0} aria-label="Снимок интерфейса; прокрутите для просмотра деталей">
        <img key={step.image.src} src={step.image.src} alt={step.image.alt} width={step.image.width} height={step.image.height} />
      </div>
      <span className={styles.panHint}>Сдвиньте изображение, чтобы рассмотреть детали.</span>
      <footer><p id={descriptionId}><InlineText text={step.result} /></p><nav aria-label="Шаги инструкции">
        <button type="button" disabled={selected === 0} onClick={() => onSelect(selected - 1)} aria-label="Предыдущий снимок"><ArrowLeft size={18} /></button>
        <button type="button" disabled={selected === steps.length - 1} onClick={() => onSelect(selected + 1)} aria-label="Следующий снимок"><ArrowRight size={18} /></button>
      </nav></footer>
    </div>}
  </dialog>;
}
