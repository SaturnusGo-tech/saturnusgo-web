export type LandingLocale = "en" | "ru";
export const LANDING_LOCALE_KEY = "falcon.landing.locale.v1";
export function isLandingLocale(value: unknown): value is LandingLocale {
  return value === "en" || value === "ru";
}
export function resolveLandingLocale(saved: unknown, browserLanguage?: string): LandingLocale {
  if (isLandingLocale(saved)) return saved;
  return /^ru(?:-|_|$)/i.test(browserLanguage ?? "") ? "ru" : "en";
}
// Runs before the landing paints. The React tree starts with the same English SSR
// content, then resolves the preference before revealing Russian content.
export const landingLocaleBootstrap = `(()=>{let s;try{s=localStorage.getItem(${JSON.stringify(LANDING_LOCALE_KEY)})}catch{}let l=s==='en'||s==='ru'?s:/^ru(?:-|_|$)/i.test(navigator.language||'')?'ru':'en';document.documentElement.dataset.falconLandingLocale=l;document.documentElement.lang=l})()`;
