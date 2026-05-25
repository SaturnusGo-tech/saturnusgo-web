// app/src/shared/_components/MobileGate.tsx
'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const MOBILE_UA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

export default function MobileGate({ minWidth = 980 }: { minWidth?: number }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (pathname?.startsWith('/mobile')) return;

    const check = () => {
      // если уже разрешили — ничего не делаем
      try { if (localStorage.getItem('allowMobile') === '1') return; } catch {}
      const ua = navigator.userAgent || '';
      const isMobileUA = MOBILE_UA.test(ua);
      const isNarrow  = window.innerWidth < minWidth;
      const isCoarse  = matchMedia?.('(hover: none) and (pointer: coarse)').matches ?? false;

      if (isMobileUA || isCoarse || isNarrow) {
        const from = encodeURIComponent(location.pathname + location.search + location.hash);
        router.replace(`/mobile?from=${from}`);
      }
    };

    check();
    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, [pathname, router, minWidth]);

  return null;
}
