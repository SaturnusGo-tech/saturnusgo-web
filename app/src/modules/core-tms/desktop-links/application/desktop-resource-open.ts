import { isFalconDesktop } from "../../auth/sign-in/domain/desktop-mode";
import { desktopResourceLink, isDirectResourceEntry } from "../domain/resource-address";

const lastOfferKey = "falcon.desktop.resource.last-offer.v1";
const offerCooldown = 5 * 60_000;
type BrowserPort = {
  userAgent: string;
  now: () => number;
  read: (key: string) => string | null;
  write: (key: string, value: string) => void;
  launch: (address: string) => void;
};

export function supportsDesktopResourceOpen(userAgent: string): boolean {
  return !isFalconDesktop(userAgent) && !/Mobile|iPhone|iPad|Android/i.test(userAgent)
    && /Macintosh|Windows NT/i.test(userAgent);
}

/** A protocol request asks the browser/OS, never transfers a session or detects installation. */
export function createDesktopResourceOpener(browser: BrowserPort) {
  let offered = false;
  return (href: string, mode: "automatic" | "explicit"): boolean => {
    if (!supportsDesktopResourceOpen(browser.userAgent)) return false;
    const command = desktopResourceLink(href);
    if (!command) return false;
    if (mode === "automatic") {
      if (offered || !isDirectResourceEntry(href)) return false;
      offered = true;
      const now = browser.now();
      try {
        const previous = JSON.parse(browser.read(lastOfferKey) ?? "null");
        if (previous?.command === command && typeof previous.time === "number"
          && now - previous.time >= 0 && now - previous.time < offerCooldown) return false;
      } catch { /* The per-document guard remains active if storage is unavailable. */ }
      try { browser.write(lastOfferKey, JSON.stringify({ command, time: now })); } catch { /* Optional cooldown. */ }
    }
    // No web fallback timeout or redirect: canceling the native prompt leaves the
    // original HTTPS route in place; a user gesture can try the same link again.
    try { browser.launch(command); return true; } catch { return false; }
  };
}

export function browserResourceOpener() {
  return createDesktopResourceOpener({
    userAgent: navigator.userAgent,
    now: Date.now,
    read: key => window.sessionStorage.getItem(key),
    write: (key, value) => window.sessionStorage.setItem(key, value),
    launch: address => window.location.assign(address),
  });
}
