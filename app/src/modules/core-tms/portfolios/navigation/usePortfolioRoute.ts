import { useEffect, useState } from "react";
import { HISTORY_CHANGE, navigateWorkspace } from "../../state/navigation/browser/workspace-history";
import type { PortfolioRoute } from "../model/portfolio";
import { portfolioRouteUrl, readPortfolioRoute } from "./portfolio-route";

export function usePortfolioRoute() {
  const [route, setRoute] = useState<PortfolioRoute>(() => typeof window === "undefined" ? { kind: "catalog" } : readPortfolioRoute(window.location.href));
  useEffect(() => {
    const read = () => setRoute(readPortfolioRoute(window.location.href));
    read(); window.addEventListener("popstate", read); window.addEventListener(HISTORY_CHANGE, read);
    return () => { window.removeEventListener("popstate", read); window.removeEventListener(HISTORY_CHANGE, read); };
  }, []);
  return { route, navigate: (next: PortfolioRoute) => navigateWorkspace(portfolioRouteUrl(window.location.href, next)) };
}
