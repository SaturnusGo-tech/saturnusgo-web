'use client';
import { useEffect, useState } from 'react';

export default function DeviceGate({
  children,
  mobileOnly = false,
  notMobile = false,
  max = 980,
}: {
  children: React.ReactNode;
  mobileOnly?: boolean;
  notMobile?: boolean;
  max?: number;
}) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width:${max}px)`);
    const update = () => setShow(mobileOnly ? mql.matches : notMobile ? !mql.matches : true);
    update();
    mql.addEventListener?.('change', update);
    return () => mql.removeEventListener?.('change', update);
  }, [mobileOnly, notMobile, max]);
  if (!show) return null;
  return <>{children}</>;
}
