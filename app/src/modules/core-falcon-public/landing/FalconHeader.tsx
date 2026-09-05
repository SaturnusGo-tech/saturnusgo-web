"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { TMS_ADMIN_LOGIN_PATH } from "../../core-tms/auth/navigation/tms-auth-route";
import { FalconBrand } from "../shared/FalconBrand";
import styles from "./landing.module.css";

const navigation = [
  { href: "#platform", label: "Платформа" },
  { href: "#automation", label: "Автоматизация" },
  { href: "#analytics", label: "Аналитика" },
  { href: "#security", label: "Безопасность" },
];

export function FalconHeader() {
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    const backgroundElements = Array.from(headerRef.current?.parentElement?.children ?? [])
      .filter((element): element is HTMLElement => (
        element instanceof HTMLElement && element !== headerRef.current
      ));
    const previousInert = backgroundElements.map((element) => element.inert);
    document.body.style.overflow = "hidden";
    backgroundElements.forEach((element) => { element.inert = true; });

    const focusableElements = () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) ?? []).filter((element) => !element.hasAttribute("disabled"));
    const focusFrame = window.requestAnimationFrame(() => {
      const first = focusableElements()[0];
      (first ?? menuRef.current)?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = focusableElements();
      if (focusable.length === 0) {
        event.preventDefault();
        menuRef.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!menuRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      backgroundElements.forEach((element, index) => { element.inert = previousInert[index]; });
      document.removeEventListener("keydown", handleKeyDown);
      (menuButtonRef.current ?? previouslyFocused)?.focus();
    };
  }, [open]);

  return (
    <header ref={headerRef} className={styles.header}>
      <div className={styles.headerInner}>
        <FalconBrand />
        <nav className={styles.desktopNav} aria-label="Основная навигация">
          {navigation.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}
        </nav>
        <div className={styles.headerActions}>
          <Link className={styles.loginButton} href={TMS_ADMIN_LOGIN_PATH}>Войти</Link>
          <Link className={styles.primaryButton} href="/signup/">Попробовать</Link>
        </div>
        <button
          ref={menuButtonRef}
          type="button"
          className={styles.menuButton}
          aria-label={open ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={open}
          aria-controls="falcon-mobile-menu"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <div
          ref={menuRef}
          id="falcon-mobile-menu"
          className={styles.mobileMenu}
          role="dialog"
          aria-modal="true"
          aria-label="Навигация Falcon"
          tabIndex={-1}
        >
          <nav aria-label="Мобильная навигация">
            {navigation.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setOpen(false)}>{item.label}</a>
            ))}
          </nav>
          <div>
            <Link href={TMS_ADMIN_LOGIN_PATH}>Войти для администраторов</Link>
            <Link className={styles.primaryButton} href="/signup/">Создать пространство</Link>
          </div>
        </div>
      )}
    </header>
  );
}
