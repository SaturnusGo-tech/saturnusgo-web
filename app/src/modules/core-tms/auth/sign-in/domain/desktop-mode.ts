/** Presentation routing only; the server remains the authority for authentication. */
export function isFalconDesktop(userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent): boolean {
  return /(?:^|\s)FalconDesktop\/\d+\.\d+\.\d+(?:\s|$)/.test(userAgent);
}
export function signedOutPath(): "/cloud-login/" {
  return "/cloud-login/";
}
export function desktopSignInCommand(method: "google" | "email" | "saml" | "company", locale: "en" | "ru", workspaceId?: string,
  userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent): string {
  const version = /(?:^|\s)FalconDesktop\/(\d+)\.(\d+)\.(\d+)(?:\s|$)/.exec(userAgent);
  const minimumPatch = method === "company" ? 5 : 4;
  if (!version || (Number(version[1]) === 0 && (Number(version[2]) < 2 || (Number(version[2]) === 2 && Number(version[3]) < minimumPatch)))) return "/desktop-sign-in/";
  const scope = method !== "company" && typeof workspaceId === "string" && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(workspaceId) ? `&workspaceId=${encodeURIComponent(workspaceId)}` : "";
  return `/desktop-sign-in/?method=${method}&lang=${locale}${scope}`;
}
