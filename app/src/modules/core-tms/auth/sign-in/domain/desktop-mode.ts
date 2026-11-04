/** Presentation routing only; the server remains the authority for authentication. */
export function isFalconDesktop(userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent): boolean {
  return /(?:^|\s)FalconDesktop\/\d+\.\d+\.\d+(?:\s|$)/.test(userAgent);
}
export function signedOutPath(): "/cloud-login/" | "/" {
  return isFalconDesktop() ? "/cloud-login/" : "/";
}
