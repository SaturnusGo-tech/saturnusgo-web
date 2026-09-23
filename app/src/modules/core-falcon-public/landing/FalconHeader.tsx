"use client";
import { useLandingLocale } from "./localization/context/LandingLocaleProvider";
import { LanguageSelector } from "./localization/presentation/LanguageSelector";
import Link from "next/link";
import { FalconBrand } from "../shared/FalconBrand";
import styles from "./landing.module.css";

export function FalconHeader() {
  const { copy } = useLandingLocale();
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <FalconBrand inverse label={copy.home} />
        <nav className={styles.headerNav} aria-label={copy.navigation}>
          <a href="#product">{copy.product}</a>
          <a href="#integrations">{copy.integrations}</a>
          <a href="#contact">{copy.contacts}</a>
        </nav>
        <div className={styles.headerActions}>
          <Link className={styles.loginButton} href="/cloud-login/">
            {copy.login}
          </Link>
          <a className={styles.primaryButton} href="#contact">{copy.contact}</a>
          <LanguageSelector />
        </div>
      </div>
    </header>
  );
}
