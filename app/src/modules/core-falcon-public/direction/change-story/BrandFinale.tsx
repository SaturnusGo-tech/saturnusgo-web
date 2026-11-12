'use client';

import { motion, useTransform, type MotionValue } from 'framer-motion';
import { FalconBrandMark } from '../../../../shared/components/brand/FalconBrandMark';
import directionStyles from '../direction.module.css';
import styles from './brand-finale.module.css';

interface BrandFinaleProps {
  time: MotionValue<number>;
  reducedMotion: boolean;
}

/** The real integration marks share one calm reveal on the story clock. */
export function BrandFinale({ time, reducedMotion }: BrandFinaleProps) {
  const opacity = useTransform(time, [44000, 45100], [0, 1]);
  const brandOpacity = useTransform(time, [44400, 46100], [0, 1]);
  const brandY = useTransform(time, [44400, 46100], [10, 0]);
  const brandFilter = useTransform(time, [44400, 46100], ['blur(6px)', 'blur(0px)']);

  return (
    <motion.div
      className={styles.finale}
      data-reduced={reducedMotion}
      style={{ opacity: reducedMotion ? 1 : opacity }}
    >
      <motion.div
        className={styles.brandRow}
        role="img"
        aria-label="Codex × Falcon"
        style={{
          opacity: reducedMotion ? 1 : brandOpacity,
          y: reducedMotion ? 0 : brandY,
          filter: reducedMotion ? 'none' : brandFilter,
        }}
      >
        <span className={`${directionStyles.brand} ${styles.brand}`}>
          <span className={styles.codexMark} aria-hidden="true">
            <img className={styles.codexDark} src="/assets/integrations/codex/codex-dark.png" width={45} height={45} alt="" />
            <img className={styles.codexLight} src="/assets/integrations/codex/codex-light.png" width={45} height={45} alt="" />
          </span>
          <span>Codex</span>
        </span>
        <span className={styles.join} aria-hidden="true">×</span>
        <span className={`${directionStyles.brand} ${styles.brand}`}>
          <FalconBrandMark className={styles.falconMark} animated={false} />
          <span>Falcon</span>
        </span>
      </motion.div>
    </motion.div>
  );
}
