'use client';

import { useEffect, useRef, useState } from 'react';
import type { LandingLocale } from '../../landing/localization/model/locale';
import type { LandingTheme } from '../../landing/theme/model';
import styles from './command-center-film.module.css';

type FilmPreferences = {
  locale: LandingLocale;
  theme: LandingTheme;
  active: boolean;
  reducedMotion: boolean;
};

type Props = { locale: LandingLocale; theme: LandingTheme; ready: boolean };

/** The approved film owns its CSS; the landing owns its lifecycle and preferences. */
export function CommandCenterFilm({ locale, theme, ready }: Props) {
  const section = useRef<HTMLElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const preferences = useRef<FilmPreferences>({ locale, theme, active: false, reducedMotion: false });
  const previousActive = useRef(false);
  const [source, setSource] = useState<string>();
  const [frameReady, setFrameReady] = useState(false);
  const [inView, setInView] = useState(false);
  const [focused, setFocused] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const active = inView && focused;
  preferences.current = { locale, theme, active, reducedMotion };

  function synchronize(restart = false) {
    frame.current?.contentWindow?.postMessage({
      type: 'falcon-film:update', ...preferences.current, restart,
    }, window.location.origin);
  }

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const visibility = () => setFocused(!document.hidden);
    const blur = () => setFocused(false);
    const focus = () => setFocused(!document.hidden);
    visibility();
    window.addEventListener('blur', blur);
    window.addEventListener('focus', focus);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('blur', blur);
      window.removeEventListener('focus', focus);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);

  useEffect(() => {
    const element = section.current;
    if (!ready || !element) return;
    const mount = () => {
      const current = preferences.current;
      setSource(value => value ?? `/falcon/landing/command-center-film/index.html?embed=1&theme=${current.theme}&lang=${current.locale}`);
    };
    if (typeof IntersectionObserver === 'undefined') {
      mount();
      setInView(true);
      return;
    }
    // Fetch before the visitor arrives; run only while enough of the scene is visible.
    const preload = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { mount(); preload.disconnect(); }
    }, { rootMargin: '700px 0px' });
    const playback = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting && entry.intersectionRatio >= 0.35);
    }, { threshold: [0, 0.35] });
    preload.observe(element);
    playback.observe(element);
    return () => { preload.disconnect(); playback.disconnect(); };
  }, [ready]);

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      if (event.data?.type !== 'falcon-film:ready') return;
      synchronize(preferences.current.active);
      previousActive.current = preferences.current.active;
      setFrameReady(true);
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, []);

  useEffect(() => {
    if (!frameReady) return;
    synchronize(active && !previousActive.current);
    previousActive.current = active;
  }, [locale, theme, active, reducedMotion, frameReady]);

  const description = locale === 'ru'
    ? 'Демонстрация Codex и Falcon: проверка покрытия API, выполнение проверок в песочнице и привязка артефактов к дефектам.'
    : 'A Codex and Falcon demonstration: reviewing API coverage, verifying behavior in Sandbox and linking evidence to defects.';

  return <section id="connected-work" ref={section} className={styles.section}
    aria-labelledby="codex-film-title" aria-describedby="codex-film-description">
    <h2 id="codex-film-title" className={styles.accessible}>Codex × Falcon</h2>
    <p id="codex-film-description" className={styles.accessible}>{description}</p>
    <div className={styles.stage} data-ready={frameReady}>
      {source && <iframe ref={frame} src={source} title={description}
        className={styles.film} tabIndex={-1} aria-hidden="true"
        sandbox="allow-scripts allow-same-origin" />}
    </div>
  </section>;
}
