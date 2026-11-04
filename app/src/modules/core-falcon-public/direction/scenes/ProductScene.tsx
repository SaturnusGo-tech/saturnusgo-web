import type { LandingLocale } from '../../landing/localization/model/locale';
import { directionCopy } from '../content/copy';
import styles from '../direction.module.css';

type SceneKind = 'hero' | 'coverage' | 'execution' | 'integrations';
export function ProductScene({ kind, locale }: { kind: SceneKind; locale: LandingLocale }) {
  const c = directionCopy[locale];
  const art = '/falcon/landing/2026-11/';
  const main = kind === 'execution' ? ['dashboard', c.dashboardAlt] : kind === 'integrations' ? ['integrations', c.integrationsAlt] : ['repository', c.heroAlt];
  const overlay = kind === 'execution' ? ['run', c.runAlt] : kind === 'integrations' ? ['codex', c.integrationsAlt] : ['suites', c.suitesAlt];
  return <figure className={styles.productScene} data-scene={kind} aria-label={kind === 'hero' ? c.heroAlt : undefined}>
    <div className={styles.scenePlane}>
      <div className={styles.sceneMain}><img src={`${art}product-${main[0]}.webp`} width={main[0] === 'integrations' ? 1063 : 1280} height={main[0] === 'integrations' ? 804 : 720} alt={main[1]} loading={kind === 'hero' ? 'eager' : 'lazy'} fetchPriority={kind === 'hero' ? 'high' : 'auto'} /></div>
      <div className={styles.sceneOverlay}><img src={`${art}product-${overlay[0]}.webp`} width={overlay[0] === 'suites' ? 1280 : 1063} height={overlay[0] === 'suites' ? 720 : 804} alt={overlay[1]} loading="lazy" /></div>
    </div>
  </figure>;
}
