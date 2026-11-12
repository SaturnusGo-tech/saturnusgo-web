import { useCallback, useEffect, useRef, useState } from "react";
import { navigateWorkspace } from "../../../state/navigation/browser/workspace-history";

type Screen = "password" | "sessions";
const locationScreen = (): Screen | null => window.location.hash === "#security" ? "password" : window.location.hash === "#sessions" ? "sessions" : null;
export function useSecurityDialog() {
  const [screen, setScreen] = useState<Screen | null>(null);
  const [pending, updatePending] = useState(false);
  const busy = useRef(false);
  const setPending = useCallback((value: boolean) => {
    busy.current = value; updatePending(value);
    if (!value) setScreen(locationScreen());
  }, []);
  useEffect(() => {
    const sync = () => {
      if (busy.current) return;
      setScreen(locationScreen());
    };
    sync();
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => { window.removeEventListener("popstate", sync); window.removeEventListener("hashchange", sync); };
  }, []);
  const navigate = (next: Screen | null) => {
    if (busy.current) return;
    const url = new URL(window.location.href);
    url.hash = next === "password" ? "security" : next === "sessions" ? "sessions" : "";
    navigateWorkspace(`${url.pathname}${url.search}${url.hash}`);
    setScreen(next);
  };
  return { screen, pending, setPending, open: (next: Screen) => navigate(next), close: () => navigate(null) };
}
