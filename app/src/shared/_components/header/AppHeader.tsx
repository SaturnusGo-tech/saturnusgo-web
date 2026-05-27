"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { LOCALE_META, SUPPORTED_LOCALES, useLanguage } from "../../i18n";
import styles from "./header.module.css";

function isNavigationItemActive(pathname: string, href: string) {
  const [routePath] = href.split("#");

  if (!routePath || routePath === "/") {
    return pathname === "/";
  }

  return pathname === routePath;
}

export default function Header() {
  const pathname = usePathname();
  const { locale, setLocale, dictionary } = useLanguage();
  const { header } = dictionary;
  const [menuOpen, setMenuOpen] = useState(false);
  const overlayId = "saturnusgo-navigation-overlay";

  const menuButtonLabel = menuOpen
    ? header.closeMenuLabel
    : header.openMenuLabel;

  const activePrimaryIndex = useMemo(
    () =>
      header.primaryNavigation.findIndex((item) =>
        isNavigationItemActive(pathname, item.href),
      ),
    [header.primaryNavigation, pathname],
  );

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.documentElement.classList.toggle(
      styles.navigationLocked,
      menuOpen,
    );

    if (!menuOpen) {
      return undefined;
    }

    const closeByEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", closeByEscape);

    return () => {
      window.removeEventListener("keydown", closeByEscape);
      document.documentElement.classList.remove(styles.navigationLocked);
    };
  }, [menuOpen]);

  return (
    <header className={styles.header} data-menu-open={menuOpen}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo} aria-label={header.brandHomeLabel}>
          SaturnusGo
        </Link>

        <button
          className={styles.menuButton}
          onClick={() => setMenuOpen((value) => !value)}
          aria-label={menuButtonLabel}
          aria-expanded={menuOpen}
          aria-controls={overlayId}
          type="button"
        >
          <span className={styles.menuButtonText}>
            {menuOpen ? header.close : header.menu}
          </span>
          <span className={styles.menuIcon} aria-hidden="true" />
        </button>
      </div>

      <div
        id={overlayId}
        className={styles.overlay}
        aria-hidden={!menuOpen}
        role="dialog"
        aria-modal="true"
        aria-label={header.overlayLabel}
      >
        <div className={styles.overlayShell}>
          <div className={styles.overlayHeader}>
            <Link
              href="/"
              className={styles.overlayLogo}
              onClick={() => setMenuOpen(false)}
            >
              SaturnusGo
            </Link>
            <button
              className={styles.closeButton}
              onClick={() => setMenuOpen(false)}
              type="button"
            >
              <span>{header.close}</span>
              <span className={styles.closeIcon} aria-hidden="true" />
            </button>
          </div>

          <div className={styles.overlayBody}>
            <nav
              className={styles.primaryNavigation}
              aria-label={header.primaryNavigationLabel}
            >
              <p className={styles.eyebrow}>{header.eyebrow}</p>
              <ol className={styles.primaryList}>
                {header.primaryNavigation.map((item, index) => {
                  const active = index === activePrimaryIndex;

                  return (
                    <li
                      key={item.href}
                      className={styles.primaryItem}
                      data-active={active}
                    >
                      <Link
                        href={item.href}
                        className={styles.primaryLink}
                        onClick={() => setMenuOpen(false)}
                      >
                        <span className={styles.primaryIndex}>
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className={styles.primaryText}>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </nav>

            <aside
              className={styles.secondaryNavigation}
              aria-label={header.allSectionsLabel}
            >
              {header.navigationGroups.map((group) => (
                <section key={group.title} className={styles.linkGroup}>
                  <h2>{group.title}</h2>
                  <ul>
                    {group.links.map((item) => (
                      <li
                        key={item.href}
                        data-active={isNavigationItemActive(
                          pathname,
                          item.href,
                        )}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setMenuOpen(false)}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </aside>
          </div>

          <div className={styles.overlayFooter}>
            <div className={styles.footerMeta}>
              <span>{header.footer.tagline}</span>
              <Link href="/#download-app" onClick={() => setMenuOpen(false)}>
                {header.footer.download}
              </Link>
            </div>

            <div
              className={styles.languageSwitcher}
              aria-label={header.language.label}
            >
              <span className={styles.languageLabel}>
                {header.language.label}
              </span>
              <div className={styles.languageOptions}>
                {SUPPORTED_LOCALES.map((option) => (
                  <button
                    key={option}
                    type="button"
                    data-active={option === locale}
                    aria-pressed={option === locale}
                    aria-label={`${header.language.current}: ${header.language.options[option]}`}
                    onClick={() => setLocale(option)}
                  >
                    <span>{LOCALE_META[option].shortName}</span>
                    <small>{header.language.options[option]}</small>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
