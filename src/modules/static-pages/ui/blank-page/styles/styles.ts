import type { CSSProperties } from 'react';

export const BLANK_PAGE_STYLES = {
  root: {
    minHeight: '100vh',
    padding: '64px 24px',
    background:
      'radial-gradient(circle at top left, rgba(143, 179, 255, 0.18), transparent 36%), var(--background)',
  },
  shell: {
    width: 'min(960px, 100%)',
    margin: '0 auto',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    border: '1px solid var(--border)',
    borderRadius: 999,
    padding: '8px 12px',
    color: 'var(--text-secondary)',
    background: 'var(--surface)',
  },
  title: {
    margin: '28px 0 12px',
    fontSize: 'clamp(36px, 7vw, 72px)',
    lineHeight: 0.95,
    letterSpacing: '-0.06em',
  },
  description: {
    maxWidth: 640,
    margin: 0,
    color: 'var(--text-secondary)',
    fontSize: 18,
    lineHeight: 1.6,
  },
  route: {
    marginTop: 28,
    display: 'inline-flex',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '12px 14px',
    color: 'var(--accent)',
    background: 'var(--surface-strong)',
  },
  param: {
    marginTop: 12,
    color: 'var(--text-secondary)',
  },
  navigation: {
    marginTop: 56,
  },
  navigationTitle: {
    margin: '0 0 8px',
    fontSize: 18,
  },
  navigationHint: {
    margin: '0 0 20px',
    color: 'var(--text-secondary)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 12,
  },
  link: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    border: '1px solid var(--border)',
    borderRadius: 18,
    padding: '14px 16px',
    background: 'var(--surface)',
  },
} satisfies Record<string, CSSProperties>;
