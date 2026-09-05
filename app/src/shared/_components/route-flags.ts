export function isFalconPublicPath(pathname: string | null | undefined): boolean {
  return pathname === "/" || /^\/(signup|cloud-login)(\/|$)/i.test(pathname ?? "");
}

export function htmlLanguageForPath(pathname: string | null | undefined, fallback: string): string {
  return isFalconPublicPath(pathname) ? "ru" : fallback;
}
