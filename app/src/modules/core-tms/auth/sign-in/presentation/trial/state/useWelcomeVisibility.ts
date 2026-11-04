import { useEffect, useState } from "react";

const dismissedInSession = new Set<string>();

/** Presentation preference only: never used to decide trial access or eligibility. */
export function useWelcomeVisibility(key: string) {
  const [visibleKey, setVisibleKey] = useState<string | null>(null);
  useEffect(() => {
    let dismissed = dismissedInSession.has(key);
    try { dismissed ||= window.localStorage.getItem(key) === "dismissed"; } catch { /* Session memory remains available. */ }
    setVisibleKey(dismissed ? null : key);
  }, [key]);
  const dismiss = () => {
    dismissedInSession.add(key);
    try { window.localStorage.setItem(key, "dismissed"); } catch { /* Keep the current session preference. */ }
    setVisibleKey(null);
  };
  return { visible: visibleKey === key, dismiss };
}
