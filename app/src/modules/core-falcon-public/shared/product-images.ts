import type { LandingLocale } from '../landing/localization/model/locale';

export type FalconProductImageName = 'repository' | 'run' | 'suites' | 'dashboard' | 'integrations' | 'codex';

export function falconProductImage(name: FalconProductImageName, locale: LandingLocale) {
  const base = `/falcon/landing/2026-11/${locale}/product-${name}`;
  return { src: `${base}.webp`, compactSrc: `${base}-1152.webp`, width: 3456, height: 2234 };
}
