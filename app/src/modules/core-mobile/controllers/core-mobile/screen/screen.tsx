import type { Metadata } from 'next';
import { Suspense } from 'react';
import MobileScreen from '../../../ui/mobile-screen';

export const metadata: Metadata = {
  title: 'Open on desktop — SaturnusGo',
  robots: { index: false, follow: false },
};

export default function MobilePage() {
  return (
    <Suspense
      fallback={
        <main style={{minHeight:'100dvh', display:'grid', placeItems:'center'}}>
          {/* Лёгкий скелет вместо ошибки при пререндере */}
        </main>
      }
    >
      <MobileScreen />
    </Suspense>
  );
}
