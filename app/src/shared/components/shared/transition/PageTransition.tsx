'use client';
import { usePathname } from 'next/navigation';
import { useEffect, PropsWithChildren } from 'react';

export default function PageTransition({ children }: PropsWithChildren) {
  const path = usePathname();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [path]);

  return (
    <div key={path} className="pt-wrap">
      <div className="pt-child">{children}</div>
    </div>
  );
}
