"use client";

import dynamic from "next/dynamic";
import { ChevronDown, Globe2 } from "lucide-react";
import { useId, useState } from "react";
import { useLandingLocale } from "../context/LandingLocaleProvider";
import styles from "./language.module.css";

// HeroUI's async imports belong in the browser bundle so the landing can be prerendered.
const LanguagePopover = dynamic(() => import("./LanguagePopover").then(module => module.LanguagePopover), { ssr: false });

export function LanguageSelector() {
  const { locale, copy } = useLandingLocale();
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const popoverId = useId();
  const languageName = locale === "ru" ? "Русский" : "English";

  return <>
    <button type="button" className={styles.trigger}
      aria-label={`${copy.language}: ${languageName}`} aria-haspopup="dialog" aria-expanded={Boolean(anchor)}
      aria-controls={anchor ? popoverId : undefined}
      onClick={(event) => {
        event.currentTarget.focus({ preventScroll: true });
        setAnchor(anchor ? null : event.currentTarget);
      }}>
      <Globe2 size={17} aria-hidden="true" />
      <span>{languageName}</span>
      <ChevronDown size={13} aria-hidden="true" className={styles.chevron} />
    </button>
    <LanguagePopover anchor={anchor} id={popoverId} onClose={() => setAnchor(null)} />
  </>;
}
