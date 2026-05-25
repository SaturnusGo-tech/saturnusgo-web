'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

type Item = { href: string; label: string };

const ITEMS: Item[] = [
  { href: '/', label: 'Home' },
  { href: '/investors', label: 'Investors' },
];

export default function TopbarNav() {
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [indicator, setIndicator] = useState<{ x: number; w: number; o: number }>({ x: 0, w: 0, o: 0 });

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');

  const activeKey = useMemo(
    () => ITEMS.find((i) => isActive(i.href))?.href ?? ITEMS[0].href,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pathname]
  );

  function measureTo(el: HTMLAnchorElement | null) {
    const nav = navRef.current;
    if (!nav || !el) return;
    const nb = nav.getBoundingClientRect();
    const eb = el.getBoundingClientRect();
    const x = Math.round(eb.left - nb.left);
    const w = Math.round(eb.width);
    setIndicator({ x, w, o: 1 });
  }

  // мгновенный отклик при таче/клике
  function handlePointerDown(e: React.PointerEvent<HTMLAnchorElement>) {
    measureTo(e.currentTarget);
  }

  // пересчёт при смене маршрута/ресайзе/загрузке шрифта
  useLayoutEffect(() => {
    const el = itemRefs.current[activeKey];
    measureTo(el);
    // ререндер после layout-изменений
    const rAF = requestAnimationFrame(() => measureTo(el));
    return () => cancelAnimationFrame(rAF);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey]);

  useEffect(() => {
    if (!navRef.current) return;
    const ro = new ResizeObserver(() => {
      measureTo(itemRefs.current[activeKey]);
    });
    ro.observe(navRef.current);
    window.addEventListener('load', () => measureTo(itemRefs.current[activeKey]), { once: true });
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey]);

  return (
    <nav ref={navRef} className="topbar__nav topbar__nav--with-indicator" aria-label="Primary">
      {ITEMS.map(({ href, label }) => {
        const active = isActive(href);
        return (
          <Link key={href} href={href} legacyBehavior>
          <a
            ref={(el) => {
              itemRefs.current[href] = el;
            }}
            onPointerDown={handlePointerDown}
            aria-current={active ? 'page' : undefined}
            className="btn btn--nav"
          >
            <span className="btn__label">{label}</span>
          </a>
        </Link>
        );
      })}
      <span
        className="nav__indicator"
        style={
          {
            '--x': `${indicator.x}px`,
            '--w': `${indicator.w}px`,
            '--o': indicator.o,
          } as React.CSSProperties
        }
        aria-hidden
      />
    </nav>
  );
}
