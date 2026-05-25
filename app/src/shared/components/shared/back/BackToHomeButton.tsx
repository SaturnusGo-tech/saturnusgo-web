// components/investors/BackToLandingCta.tsx
'use client';

import Link from 'next/link';

type Label = 'Back to Landing' | 'Back to Home' | 'Back to Main' | 'Back to Local';

export default function BackToLandingCta({ label = 'Back to Landing' }: { label?: Label }) {
  return (
    <Link href="/" aria-label={label} className="btn btn-subtle btn--sm">
      <svg
        className="btn__icon-left"
        viewBox="0 0 24 24"
        width="16"
        height="16"
        aria-hidden
        focusable="false"
      >
        <path
          d="M15 18l-6-6 6-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>{label}</span>
    </Link>
  );
}
