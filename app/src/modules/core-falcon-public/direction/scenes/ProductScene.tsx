import type { LandingLocale } from '../../landing/localization/model/locale';
import { directionCopy } from '../content/copy';
import { falconProductImage } from '../../shared/product-images';
import styles from '../direction.module.css';

type SceneKind = 'hero' | 'coverage' | 'execution' | 'integrations';
export function ProductScene({ kind, locale }: { kind: SceneKind; locale: LandingLocale }) {
  const c = directionCopy[locale];
  const main = falconProductImage(kind === 'execution' ? 'dashboard' : kind === 'integrations' ? 'integrations' : 'repository', locale);
  const overlay = falconProductImage(kind === 'execution' ? 'run' : kind === 'integrations' ? 'codex' : 'suites', locale);
  const mainAlt = kind === 'execution' ? c.dashboardAlt : kind === 'integrations' ? c.integrationsAlt : c.heroAlt;
  const overlayAlt = kind === 'execution' ? c.runAlt : kind === 'integrations' ? c.integrationsAlt : c.suitesAlt;
  return <figure className={styles.productScene} data-scene={kind} aria-label={kind === 'hero' ? c.heroAlt : undefined}>
    <div className={styles.scenePlane}>
      <picture className={styles.sceneMain}>
        <source media="(max-width: 760px)" srcSet={main.compactSrc} />
        <img src={main.src} width={main.width} height={main.height} alt={mainAlt} loading={kind === 'hero' ? 'eager' : 'lazy'} fetchPriority={kind === 'hero' ? 'high' : 'auto'} />
      </picture>
      <picture className={styles.sceneOverlay}>
        <source media="(max-width: 760px)" srcSet={overlay.compactSrc} />
        <img src={overlay.src} width={overlay.width} height={overlay.height} alt={overlayAlt} loading={kind === 'hero' ? 'eager' : 'lazy'} />
      </picture>
    </div>
  </figure>;
}
