import type { LandingTheme } from '../landing/theme/model';
import type { LandingLocale } from '../landing/localization/model/locale';

export type FalconProductImageName = 'repository' | 'run' | 'suites' | 'dashboard' | 'integrations' | 'codex' | 'docs' | 'docs-overview';

export function falconProductImage(name: FalconProductImageName, locale: LandingLocale, theme: LandingTheme = 'dark') {
  const base = `/falcon/landing/2026-11/themes/${theme}/${locale}/product-${name}`;
  return { src: `${base}.webp`, compactSrc: `${base}-1152.webp`, width: 3456, height: 2234 };
}
