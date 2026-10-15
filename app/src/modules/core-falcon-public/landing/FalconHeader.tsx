"use client";
import { useLandingLocale } from "./localization/context/LandingLocaleProvider";
import { LanguageSelector } from "./localization/presentation/LanguageSelector";
import styles from "./landing.module.css";

export function FalconHeader({ onDemo, onBack }: { onDemo: () => void; onBack: () => void }) {
  const { copy, locale } = useLandingLocale();
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <button className={styles.homeButton} onClick={onBack} aria-label={copy.home}>← Falcon</button>
        <nav className={styles.headerNav} aria-label={copy.navigation}>
          <a href="#product">{copy.product}</a>
          <a href="#integrations">{copy.integrations}</a>
          <a href="#contact">{copy.contacts}</a>
        </nav>
        <div className={styles.headerActions}>
          <button className={styles.primaryButton} onClick={onDemo}>{locale === "ru" ? "Запросить демо" : "Book a demo"}</button>
          <LanguageSelector />
        </div>
      </div>
    </header>
  );
}
