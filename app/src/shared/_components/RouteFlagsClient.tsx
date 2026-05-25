// app/src/shared/_components/RouteFlagsClient.tsx
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function RouteFlagsClient() {
  const pathname = usePathname();

  useEffect(() => {
    const html = document.documentElement;
    const isInvestors = /^\/(investors|inversors)(\/|$)/.test(pathname || '');
    if (isInvestors) html.setAttribute('data-investors', '1');
    else html.removeAttribute('data-investors');
  }, [pathname]);

  return null;
}
