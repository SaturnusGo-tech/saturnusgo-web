"use client";

import { Menu, Moon, Sun, X } from "lucide-react";
import Link from "next/link";
import type { MouseEvent } from "react";
import { useEffect, useState } from "react";

import { useColorMode } from "../../_hooks/useColorMode";
import styles from "./header.module.css";

const NAVIGATION_LINKS = [
  { href: "/", label: "Home" },
  { href: "/features", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "/partners", label: "Company" },
  { href: "/support", label: "Contact Us" },
] as const;

function WaitlistCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCount() {
      try {
        const response = await fetch("/api/waitlist/count", {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          setCount(null);
          return;
        }

        const data: unknown = await response.json();
        const nextCount = resolveWaitlistCount(data);
        setCount(nextCount);
      } catch (error) {
        if (!controller.signal.aborted) {
          setCount(null);
        }
      }
    }

    void loadCount();

    return () => controller.abort();
  }, []);

  if (count === null) {
    return null;
  }

  return <span className={styles.waitlistPill}>{count.toLocaleString()} joined</span>;
}

function resolveWaitlistCount(data: unknown): number | null {
  if (!data || typeof data !== "object" || !("count" in data)) {
    return null;
  }

  const value = (data as { count: unknown }).count;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isLight, toggleAnimated } = useColorMode();

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleThemeClick = (event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    toggleAnimated({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ""}`}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo} aria-label="SaturnusGo home">
          <span className={styles.logoMark}>SG</span>
          <span className={styles.brandText}>SaturnusGo</span>
        </Link>

        <nav className={styles.nav} aria-label="Primary navigation">
          <ul className={styles.navLinks}>
            {NAVIGATION_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={styles.navLink}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.actions}>
          <WaitlistCount />
          <Link href="/#waitlist" className={styles.trialButton}>Start Free Trial</Link>
          <button className={styles.themeToggle} onClick={handleThemeClick} aria-label="Toggle theme" type="button">
            {mounted && isLight ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button
            className={styles.mobileMenuButton}
            onClick={() => setMobileMenuOpen((value) => !value)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
            type="button"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <div className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.open : ""}`}>
        <ul className={styles.mobileNavLinks}>
          {NAVIGATION_LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={styles.mobileNavLink} onClick={closeMobileMenu}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/#waitlist" className={styles.mobileTrialButton} onClick={closeMobileMenu}>
          Start Free Trial
        </Link>
      </div>
    </header>
  );
}
