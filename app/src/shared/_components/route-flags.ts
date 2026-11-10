export function isFalconPublicPath(pathname: string | null | undefined): boolean {
  return pathname === "/" || pathname === '/ru/' || /^\/(?:ru\/)?(?:docs|contact-support)(\/|$)/i.test(pathname ?? "") || /^\/(signup|login|cloud-login|privacy|trial-terms)(\/|$)/i.test(pathname ?? "");
}

export function htmlLanguageForPath(pathname: string | null | undefined, fallback: string, landingLocale?: string): string {
  if (pathname === "/" || pathname === '/ru/') return landingLocale === "ru" || (pathname === '/ru/' && landingLocale !== 'en') ? "ru" : "en";
  if (/^\/(?:docs|contact-support)(\/|$)/i.test(pathname ?? "")) return "en";
  if (/^\/ru\/(?:docs|contact-support)(\/|$)/i.test(pathname ?? "")) return "ru";
  return isFalconPublicPath(pathname) ? "ru" : fallback;
}
