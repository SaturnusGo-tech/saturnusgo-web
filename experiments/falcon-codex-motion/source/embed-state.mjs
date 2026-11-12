/** Strict public interface for the same-origin landing frame. */
export const UPDATE_TYPE = 'falcon-film:update';
export const READY_TYPE = 'falcon-film:ready';
export const REDUCED_FRAME = 29.1;

export function isTrustedEmbedMessage(event, parent, origin) {
  return event.source === parent && event.origin === origin
    && event.data !== null && typeof event.data === 'object'
    && event.data.type === UPDATE_TYPE;
}

export function applyEmbedUpdate(state, update) {
  return {
    theme: update.theme === 'light' || update.theme === 'dark' ? update.theme : state.theme,
    locale: update.locale === 'en' || update.locale === 'ru' ? update.locale : state.locale,
    active: typeof update.active === 'boolean' ? update.active : state.active,
    reducedMotion: typeof update.reducedMotion === 'boolean' ? update.reducedMotion : state.reducedMotion,
    restart: update.restart === true ? state.restart + 1 : state.restart,
  };
}

export function advanceEmbedTime(base, elapsed, duration) {
  // Hold the completed lockup instead of fading to an empty last frame.
  return Math.max(0, Math.min(base + Math.max(0, elapsed), duration - .65));
}
