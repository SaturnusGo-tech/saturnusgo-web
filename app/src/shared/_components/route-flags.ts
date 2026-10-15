export function isFalconPublicPath(pathname: string | null | undefined): boolean {
  return pathname === "/" || /^\/(signup|cloud-login|privacy)(\/|$)/i.test(pathname ?? "");
}

export function htmlLanguageForPath(pathname: string | null | undefined, fallback: string, landingLocale?: string): string {
  if (pathname === "/") return landingLocale === "ru" ? "ru" : "en";
  return isFalconPublicPath(pathname) ? "ru" : fallback;
}
