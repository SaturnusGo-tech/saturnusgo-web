'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import TopbarWaitlistCount from '../components/shared/wait-list/top-bar/TopbarWaitlistCount';

function useIsMobile(maxWidth = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width:${maxWidth}px)`);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    // поддержка старых браузеров
    if (mql.addEventListener) mql.addEventListener('change', onChange);
    else mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange);
      else mql.removeListener(onChange);
    };
  }, [maxWidth]);
  return isMobile;
}

export default function TopbarBrand() {
  const isMobile = useIsMobile(768);

  return (
    <div className="topbar__brand">
      <Link href="/" aria-label="Back to Landing" className="brand-link" prefetch>
        <span className="brand-title">SaturnusGo</span>
      </Link>
      {/* На мобилке не отображаем waitlist */}
      {!isMobile && <TopbarWaitlistCount />}
    </div>
  );
}
