"use client";

import { useCallback, useEffect, useState } from "react";
import { transitionContent } from "../../../presentation/workspace/motion/transition/content-transition";

export type AdministrationRoute = { readonly section?: "sandbox" | "admin" | "profile"; readonly id: string | null; readonly creating: boolean; readonly page?: "company" | "audit" };
function currentRoute(): AdministrationRoute {
  const query = new URLSearchParams(window.location.search);
  const page = query.get("page");
  const section = window.location.pathname.split("/")[1];
  return { ...(section === "sandbox" || section === "admin" || section === "profile" ? { section } : {}), id: query.get("id"), creating: query.get("create") === "true", ...(page === "company" || page === "audit" ? { page } : {}) };
}
export function useAdministrationNavigation() {
  const [route, setRoute] = useState<AdministrationRoute>(() => typeof window === "undefined" ? { id: null, creating: false } : currentRoute());
  useEffect(() => {
    setRoute(currentRoute());
    const changed = () => setRoute(currentRoute());
    window.addEventListener("popstate", changed);
    return () => window.removeEventListener("popstate", changed);
  }, []);
  const navigate = useCallback((next: AdministrationRoute) => {
    const query = new URLSearchParams();
    if (next.id) query.set("id", next.id);
    if (next.page) query.set("page", next.page);
    if (next.creating) query.set("create", "true");
    transitionContent(() => {
      const path = next.section ? `/${next.section}/` : window.location.pathname;
      window.history.pushState({}, "", `${path}${query.size ? `?${query}` : ""}`);
      setRoute(currentRoute());
      window.scrollTo({ top: 0 });
    });
  }, []);
  return { route, navigate };
}
