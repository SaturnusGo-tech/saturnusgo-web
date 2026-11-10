"use client";

import { ChevronDown, Globe2 } from "lucide-react";
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { useLandingLocale } from "../context/LandingLocaleProvider";
import styles from "./language.module.css";

export const LanguageTrigger = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<"button">>(
  function LanguageTrigger(props, ref) {
    const { locale, copy } = useLandingLocale();
    const languageName = locale === "ru" ? "Русский" : "English";

    return <button {...props} ref={ref} type="button" className={styles.trigger}
      aria-label={`${copy.language}: ${languageName}`}>
      <Globe2 size={17} aria-hidden="true" />
      <span lang={locale}>{languageName}</span>
      <ChevronDown size={13} aria-hidden="true" className={styles.chevron} />
    </button>;
  },
);
