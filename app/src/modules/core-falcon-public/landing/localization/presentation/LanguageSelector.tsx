"use client";
import { Check, Globe2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useLandingLocale } from "../context/LandingLocaleProvider";
import styles from "./language.module.css";
export function LanguageSelector() {
  const { locale, preference, copy, setLocale } = useLandingLocale();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);
  return <div className={styles.root} ref={root} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <button className={styles.trigger} ref={trigger} type="button" aria-label={`${copy.language}: ${locale === "en" ? "English" : "Русский"}`} aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
      <Globe2 size={19} aria-hidden="true" /><span>{locale.toUpperCase()}</span>
    </button>
    {open && <div id={id} className={styles.panel} role="group" aria-label={copy.language}>
      {([{ value: "en", label: "English" }, { value: "ru", label: "Русский" }, { value: null, label: copy.auto }] as const).map(option => <button key={option.value ?? "auto"} type="button" lang={option.value ?? locale} aria-pressed={preference === option.value} onClick={() => { setLocale(option.value); setOpen(false); trigger.current?.focus(); }}>
        {option.label}{preference === option.value && <Check size={15} aria-hidden="true" />}
      </button>)}
    </div>}
  </div>;
}
