// components/shared/bar/TopbarDeckButton.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function TopbarDeckButton() {
  const pathname = usePathname() || '';
  const isInvestors = pathname.startsWith('/investors') || pathname.startsWith('/inversors');
  if (!isInvestors) return null;

  // TODO: при необходимости поправь URL на фактический путь к деку
  const DECK_URL = '/investors/deck';

  return (
    <Link
      href={DECK_URL}
      target="_blank"
      rel="noopener noreferrer"
      prefetch={false}
      className="open-deck-btn"
      aria-label="Open investor deck"
    >
      Open deck
    </Link>
  );
}
