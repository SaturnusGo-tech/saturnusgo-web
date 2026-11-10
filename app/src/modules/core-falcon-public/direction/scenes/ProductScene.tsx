import type { LandingLocale } from '../../landing/localization/model/locale';
import { directionCopy } from '../content/copy';
import { falconProductImage, type FalconProductImageName } from '../../shared/product-images';
import styles from '../direction.module.css';

type SceneKind = 'hero' | 'coverage' | 'execution' | 'integrations' | 'documentation';

type SceneImage = {
  src: string;
  width: number;
  height: number;
  compactSrc?: string;
  compactWidth?: number;
  compactHeight?: number;
};

const compactImageVersion = '20261107';
const docsImageVersion = '20261110';
const dashboardImageVersion = '20261111';

function standardImage(name: FalconProductImageName, locale: LandingLocale): SceneImage {
  const capture = falconProductImage(name, locale);
  if (name === 'dashboard') return {
    ...capture,
    src: `${capture.src}?v=${dashboardImageVersion}`,
    compactSrc: `${capture.compactSrc}?v=${dashboardImageVersion}`,
  };
  return { ...capture, compactSrc: `${capture.compactSrc}?v=${compactImageVersion}` };
}

export function ProductScene({ kind, locale, descriptionId }: {
  kind: SceneKind;
  locale: LandingLocale;
  descriptionId?: string;
}) {
  const c = directionCopy[locale];
  const docsBase = `/falcon/landing/2026-11/${locale}/product-docs`;
  const documentation = kind === 'documentation';
  const main: SceneImage = documentation
    ? {
      src: `${docsBase}.webp?v=${docsImageVersion}`, width: 2000, height: 1293,
      compactSrc: `${docsBase}-1152.webp?v=${docsImageVersion}`, compactWidth: 1152, compactHeight: 1024,
    }
    : standardImage(kind === 'execution' ? 'dashboard' : kind === 'integrations' ? 'integrations' : 'repository', locale);
  const overlay: SceneImage = documentation
    ? { src: `${docsBase}-overview.webp`, width: 1728, height: 1117 }
    : standardImage(kind === 'execution' ? 'run' : kind === 'integrations' ? 'codex' : 'suites', locale);
  const mainAlt = documentation ? c.documentation.alt : kind === 'execution' ? c.dashboardAlt : kind === 'integrations' ? c.integrationsAlt : c.heroAlt;
  const overlayAlt = documentation ? c.documentation.overviewAlt : kind === 'execution' ? c.runAlt : kind === 'integrations' ? c.integrationsAlt : c.suitesAlt;
  return <figure className={styles.productScene} data-scene={kind}
    aria-label={kind === 'hero' ? c.heroAlt : undefined} aria-describedby={descriptionId}>
    <div className={styles.scenePlane}>
      <picture className={styles.sceneMain}>
        <source media="(max-width: 760px)" srcSet={main.compactSrc} width={main.compactWidth} height={main.compactHeight} />
        <img src={main.src} width={main.width} height={main.height} alt={mainAlt} loading={kind === 'hero' ? 'eager' : 'lazy'} fetchPriority={kind === 'hero' ? 'high' : 'auto'} />
      </picture>
      <picture className={styles.sceneOverlay}>
        {overlay.compactSrc && <source media="(max-width: 760px)" srcSet={overlay.compactSrc} />}
        <img src={overlay.src} width={overlay.width} height={overlay.height} alt={overlayAlt} loading={kind === 'hero' ? 'eager' : 'lazy'} />
      </picture>
    </div>
  </figure>;
}
