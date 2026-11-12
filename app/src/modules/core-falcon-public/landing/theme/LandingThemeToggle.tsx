'use client';

import dynamic from 'next/dynamic';
import { Sun } from 'lucide-react';
import styles from './theme.module.css';

// HeroUI overlays load after hydration, as with the landing language menu.
export const LandingThemeToggle = dynamic(
  () => import('./LandingThemeControl').then(module => module.LandingThemeControl),
  { ssr: false, loading: () => <button type="button" className={styles.toggle} disabled aria-hidden="true" tabIndex={-1}><Sun size={17} /></button> },
);
