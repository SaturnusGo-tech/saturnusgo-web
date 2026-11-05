import { achievementOrbit } from './achievement-orbit';

const durations = [96, 108, 90, 116, 102, 110];

export function animateAchievementOrbits(art: HTMLDivElement) {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let animations: Animation[] = [];
  let paused = false;
  let visible = !('IntersectionObserver' in window);

  const sync = () => {
    const playing = visible && !paused && !document.hidden && !preference.matches;
    animations.forEach(animation => playing ? animation.play() : animation.pause());
  };

  const create = () => {
    animations.forEach(animation => animation.cancel());
    animations = [];
    if (preference.matches || typeof art.animate !== 'function' || !art.offsetWidth || !art.offsetHeight) return;
    const anchor = art.querySelector<HTMLImageElement>('[data-anchor] img');
    if (!anchor) return;
    const centerOf = (badge: HTMLImageElement) => ({
      x: (badge.offsetLeft + badge.offsetWidth / 2) / art.offsetWidth,
      y: (badge.offsetTop + badge.offsetHeight / 2) / art.offsetHeight,
    });
    const center = centerOf(anchor);
    animations = Array.from(art.querySelectorAll<HTMLDivElement>('[data-orbit]')).flatMap((orbit, index) => {
      const badge = orbit.querySelector('img');
      if (!badge) return [];
      const animation = orbit.animate(achievementOrbit(centerOf(badge), center), {
        duration: durations[index] * 1000,
        iterations: Infinity,
        easing: 'linear',
      });
      animation.pause();
      return [animation];
    });
    sync();
  };

  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting);
    if (visible && !animations.length && !preference.matches) create();
    else sync();
  }) : null;
  observer?.observe(art);
  preference.addEventListener('change', create);
  document.addEventListener('visibilitychange', sync);
  create();

  return {
    setPaused(value: boolean) { paused = value; sync(); },
    dispose() {
      animations.forEach(animation => animation.cancel());
      observer?.disconnect();
      preference.removeEventListener('change', create);
      document.removeEventListener('visibilitychange', sync);
    },
  };
}
