import { useEffect, useState } from "react";
import { HISTORY_CHANGE, navigateWorkspace } from "../../../state/navigation/browser/workspace-history";

type PortfolioTab = "about" | "projects";
export function usePortfolioTab(portfolioId: string) {
  const read = (): PortfolioTab => {
    if (typeof window === "undefined") return "about";
    const params = new URL(window.location.href).searchParams;
    return params.get("view") === "portfolios" && params.get("portfolioId") === portfolioId && params.get("portfolioTab") === "projects" ? "projects" : "about";
  };
  const [tab, setTab] = useState<PortfolioTab>(read);
  useEffect(() => {
    const restore = () => setTab(read());
    restore(); window.addEventListener("popstate", restore); window.addEventListener(HISTORY_CHANGE, restore);
    return () => { window.removeEventListener("popstate", restore); window.removeEventListener(HISTORY_CHANGE, restore); };
  }, [portfolioId]);
  return { tab, select(next: PortfolioTab) {
    const url = new URL(window.location.href);
    if (url.searchParams.get("view") !== "portfolios" || url.searchParams.get("portfolioId") !== portfolioId) return;
    url.searchParams.set("portfolioTab", next);
    navigateWorkspace(url.href); setTab(next);
  } };
}
