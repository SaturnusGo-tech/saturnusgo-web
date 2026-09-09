"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { INTEGRATIONS } from "../../../core-tms/presentation/hooks/catalog/integration-definitions";
import styles from "../landing.module.css";

const planned = new Set(["gitlab", "jenkins", "teamcity"]);

export function IntegrationMarquee() {
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
              aria-label={duplicate ? undefined : "Каталог интеграций Falcon"}
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
                  {planned.has(id) && <small>Скоро</small>}
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
            ? "Запустить строку интеграций"
            : "Остановить строку интеграций"
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
