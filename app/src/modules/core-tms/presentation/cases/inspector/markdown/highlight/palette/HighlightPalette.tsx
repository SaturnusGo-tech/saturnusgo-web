"use client";

import { Eraser } from "lucide-react";
import { highlightColors, type HighlightColor } from "../model/highlightColors";
import css from "../toolbar/highlightToolbar.module.css";

const labels = {
  ru: { title: "Маркер", remove: "Убрать выделение", yellow: "Жёлтый", blue: "Голубой", green: "Зелёный", pink: "Розовый", purple: "Лиловый" },
  en: { title: "Highlight", remove: "Remove highlight", yellow: "Yellow", blue: "Blue", green: "Green", pink: "Pink", purple: "Purple" },
};
export function HighlightPalette({ locale, onChoose }: { locale: "ru" | "en"; onChoose: (color: HighlightColor | null) => void }) {
  const text = labels[locale];
  return <>
    <div className={css.colors} role="group" aria-label={text.title}>
      {highlightColors.map((color) => <button key={color} type="button" data-color={color} className={css.swatch}
        title={text[color]} aria-label={text[color]} onClick={() => onChoose(color)} />)}
    </div>
    <button type="button" className={css.remove} onClick={() => onChoose(null)}><Eraser size={15} />{text.remove}</button>
  </>;
}
