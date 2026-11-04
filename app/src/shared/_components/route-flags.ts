export function isFalconPublicPath(pathname: string | null | undefined): boolean {
  return pathname === "/" || pathname === '/ru/' || /^\/(signup|login|cloud-login|privacy|trial-terms)(\/|$)/i.test(pathname ?? "");
}

export function htmlLanguageForPath(pathname: string | null | undefined, fallback: string, landingLocale?: string): string {
  if (pathname === "/" || pathname === '/ru/') return landingLocale === "ru" || (pathname === '/ru/' && landingLocale !== 'en') ? "ru" : "en";
  return isFalconPublicPath(pathname) ? "ru" : fallback;
}
