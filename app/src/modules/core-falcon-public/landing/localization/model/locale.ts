export type LandingLocale = "en" | "ru";
export const LANDING_LOCALE_KEY = "falcon.landing.locale.v1";
export function isLandingLocale(value: unknown): value is LandingLocale {
  return value === "en" || value === "ru";
}
export function resolveLandingLocale(saved: unknown, browserLanguage?: string, requested?: unknown): LandingLocale {
  if (isLandingLocale(requested)) return requested;
  if (isLandingLocale(saved)) return saved;
  return /^ru(?:-|_|$)/i.test(browserLanguage ?? "") ? "ru" : "en";
}
// Runs before the landing paints. The React tree starts with the same English SSR
// content, then resolves the preference before revealing Russian content.
export const landingLocaleBootstrap = `(()=>{let s;try{s=localStorage.getItem(${JSON.stringify(LANDING_LOCALE_KEY)})}catch{}let p=typeof location==='object'?location.pathname:'';let q=typeof location==='object'?new URLSearchParams(location.search).get('lang'):null;let l=q==='en'||q==='ru'?q:p==='/ru/'?'ru':p==='/'?'en':s==='en'||s==='ru'?s:/^ru(?:-|_|$)/i.test(navigator.language||'')?'ru':'en';document.documentElement.dataset.falconLandingLocale=l;document.documentElement.lang=l})()`;

export function requestedLandingLocale(pathname: string, search: string): LandingLocale | undefined {
  const query = new URLSearchParams(search).get('lang');
  return isLandingLocale(query) ? query : pathname === '/ru/' ? 'ru' : pathname === '/' ? 'en' : undefined;
}
export function landingLanguageURL(value: string, locale: LandingLocale): URL {
  const url = new URL(value);
  url.pathname = locale === 'ru' ? '/ru/' : '/';
  url.searchParams.delete('lang');
  return url;
}
