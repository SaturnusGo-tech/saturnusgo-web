"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./header.module.css";

type NavigationItem = {
  href: string;
  label: string;
};

type NavigationGroup = {
  title: string;
  links: readonly NavigationItem[];
};

const PRIMARY_NAVIGATION_LINKS = [
  { href: "/", label: "Главная" },
  { href: "/features", label: "Возможности" },
  { href: "/mobile", label: "Приложение" },
  { href: "/pricing", label: "Тарифы" },
  { href: "/investors", label: "Инвесторам" },
  { href: "/partners", label: "Партнёрам" },
] as const satisfies readonly NavigationItem[];

const NAVIGATION_GROUPS = [
  {
    title: "Продукт",
    links: [
      { href: "/#trips", label: "Поездки" },
      { href: "/#delivery", label: "Доставка" },
      { href: "/#places", label: "Места" },
      { href: "/topup-crypto", label: "Crypto top-up" },
    ],
  },
  {
    title: "Инвесторам",
    links: [
      { href: "/investors", label: "Обзор" },
      { href: "/investors/methodology", label: "Методология" },
      { href: "/press", label: "Пресса" },
      { href: "/founder", label: "Founder" },
    ],
  },
  {
    title: "Партнёрам",
    links: [
      { href: "/partners/about", label: "О партнёрстве" },
      { href: "/partners/apply", label: "Подать заявку" },
      { href: "/partners/listing", label: "Листинг" },
      { href: "/partners/benefits/platform", label: "Платформа" },
      { href: "/partners/benefits/reach", label: "Охват" },
      { href: "/partners/benefits/trusted", label: "Доверие" },
      { href: "/partners/careers", label: "Вакансии" },
      { href: "/partners/compliance", label: "Compliance" },
      { href: "/partners/news", label: "Новости" },
      { href: "/partners/contacts", label: "Контакты" },
    ],
  },
  {
    title: "Помощь",
    links: [
      { href: "/support", label: "Поддержка" },
      { href: "/faq", label: "FAQ" },
      { href: "/changelog", label: "Changelog" },
      { href: "/partners/privacy", label: "Privacy" },
      { href: "/partners/terms", label: "Terms" },
      { href: "/partners/cookies", label: "Cookies" },
    ],
  },
] as const satisfies readonly NavigationGroup[];

function isNavigationItemActive(pathname: string, href: string) {
  const [routePath] = href.split("#");

  if (!routePath || routePath === "/") {
    return pathname === "/";
  }

  return pathname === routePath;
}

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const overlayId = "saturnusgo-navigation-overlay";

  const menuButtonLabel = menuOpen ? "Закрыть меню" : "Открыть меню";

  const activePrimaryIndex = useMemo(
    () =>
      PRIMARY_NAVIGATION_LINKS.findIndex((item) =>
        isNavigationItemActive(pathname, item.href),
      ),
    [pathname],
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
        <Link href="/" className={styles.logo} aria-label="SaturnusGo home">
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
            {menuOpen ? "Close" : "Menu"}
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
        aria-label="Навигация SaturnusGo"
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
              <span>Закрыть</span>
              <span className={styles.closeIcon} aria-hidden="true" />
            </button>
          </div>

          <div className={styles.overlayBody}>
            <nav
              className={styles.primaryNavigation}
              aria-label="Главная навигация"
            >
              <p className={styles.eyebrow}>Navigation</p>
              <ol className={styles.primaryList}>
                {PRIMARY_NAVIGATION_LINKS.map((item, index) => {
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
              aria-label="Все разделы сайта"
            >
              {NAVIGATION_GROUPS.map((group) => (
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
            <span>Urban mobility · Travel intelligence · City services</span>
            <Link href="/#download-app" onClick={() => setMenuOpen(false)}>
              Скачать приложение
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
