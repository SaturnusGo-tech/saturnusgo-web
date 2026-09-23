"use client";

import { useLandingLocale } from "../localization/context/LandingLocaleProvider";
import { Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { INTEGRATIONS } from "../../../core-tms/presentation/hooks/catalog/integration-definitions";
import styles from "../landing.module.css";

export function IntegrationMarquee() {
  const { copy } = useLandingLocale();
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const sync = () => setHidden(document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);
  return (
    <div className={styles.marquee}>
      <div className={styles.marqueeWindow}>
        <div className={styles.marqueeTrack} data-paused={paused || hidden}>
          {[false, true].map((duplicate) => (
            <ul
              key={String(duplicate)}
              className={styles.marqueeGroup}
              aria-label={duplicate ? undefined : copy.catalog}
              aria-hidden={duplicate || undefined}
            >
              {INTEGRATIONS.map(({ id, name, icon: Icon }) => (
                <li key={id} className={styles.marqueeBrand}>
                  {Icon ? (
                    <Icon aria-hidden="true" />
                  ) : (
                    <img
                      src="/falcon/integrations/youtrack.svg"
                      alt=""
                      width={28}
                      height={28}
                      loading="lazy"
                    />
                  )}
                  <span>{name}</span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
      <button
        type="button"
        className={styles.marqueeToggle}
        onClick={() => setPaused(!paused)}
        aria-label={
          paused
            ? copy.resumeMarquee
            : copy.pauseMarquee
        }
        aria-pressed={paused}
      >
        {paused ? (
          <Play size={14} aria-hidden="true" />
        ) : (
          <Pause size={14} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
