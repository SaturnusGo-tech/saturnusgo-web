import type { LandingLocale } from '../../landing/localization/model/locale';
import { directionCopy } from '../content/copy';
import { falconProductImage } from '../../shared/product-images';
import styles from '../direction.module.css';

type SceneKind = 'hero' | 'coverage' | 'execution' | 'integrations' | 'documentation';

export function ProductScene({ kind, locale, descriptionId }: {
  kind: SceneKind;
  locale: LandingLocale;
  descriptionId?: string;
}) {
  const c = directionCopy[locale];
  const documentation = kind === 'documentation';
  const mainName = documentation ? 'docs' : kind === 'execution' ? 'dashboard' : kind === 'integrations' ? 'integrations' : 'repository';
  const overlayName = documentation ? 'docs-overview' : kind === 'execution' ? 'run' : kind === 'integrations' ? 'codex' : 'suites';
  const mainAlt = documentation ? c.documentation.alt : kind === 'execution' ? c.dashboardAlt : kind === 'integrations' ? c.integrationsAlt : c.heroAlt;
  const overlayAlt = documentation ? c.documentation.overviewAlt : kind === 'execution' ? c.runAlt : kind === 'integrations' ? c.integrationsAlt : c.suitesAlt;
  return <figure className={styles.productScene} data-scene={kind}
    aria-label={kind === 'hero' ? c.heroAlt : undefined} aria-describedby={descriptionId}>
    {(['dark', 'light'] as const).map(theme => {
      const main = falconProductImage(mainName, locale, theme);
      const overlay = falconProductImage(overlayName, locale, theme);
      return <div key={theme} className={styles.scenePlane} data-product-theme={theme}>
      <picture className={styles.sceneMain}>
        <source media="(max-width: 760px)" srcSet={main.compactSrc} />
        <img src={main.src} width={main.width} height={main.height} alt={mainAlt} loading={kind === 'hero' ? 'eager' : 'lazy'} fetchPriority={kind === 'hero' ? 'high' : 'auto'} />
      </picture>
      <picture className={styles.sceneOverlay}>
        {overlay.compactSrc && <source media="(max-width: 760px)" srcSet={overlay.compactSrc} />}
        <img src={overlay.src} width={overlay.width} height={overlay.height} alt={overlayAlt} loading={kind === 'hero' ? 'eager' : 'lazy'} />
      </picture>
    </div>;
    })}
  </figure>;
}
