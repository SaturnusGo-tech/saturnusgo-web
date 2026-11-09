"use client";

import dynamic from "next/dynamic";
import { ChevronDown, Globe2 } from "lucide-react";
import { useState } from "react";
import { useLandingLocale } from "../context/LandingLocaleProvider";
import styles from "./language.module.css";

// HeroUI's async imports belong in the browser bundle so the landing can be prerendered.
const LanguageDialog = dynamic(() => import("./LanguageDialog").then(module => module.LanguageDialog), { ssr: false });

export function LanguageSelector() {
  const { locale, copy } = useLandingLocale();
  const [open, setOpen] = useState(false);
  const languageName = locale === "ru" ? "Русский" : "English";

  return <>
    <button type="button" className={styles.trigger}
      aria-label={`${copy.language}: ${languageName}`} aria-haspopup="dialog" aria-expanded={open}
      onClick={() => setOpen(true)}>
      <Globe2 size={17} aria-hidden="true" />
      <span>{languageName}</span>
      <ChevronDown size={13} aria-hidden="true" className={styles.chevron} />
    </button>
    <LanguageDialog open={open} onOpenChange={setOpen} />
  </>;
}
