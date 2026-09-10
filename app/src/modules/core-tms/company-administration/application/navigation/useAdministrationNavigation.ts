"use client";

import { useCallback, useEffect, useState } from "react";

export type AdministrationRoute = { readonly id: string | null; readonly creating: boolean; readonly page?: "company" | "audit" };
function currentRoute(): AdministrationRoute {
  const query = new URLSearchParams(window.location.search);
  const page = query.get("page");
  return { id: query.get("id"), creating: query.get("create") === "true", ...(page === "company" || page === "audit" ? { page } : {}) };
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
    window.history.pushState({}, "", `${window.location.pathname}${query.size ? `?${query}` : ""}`);
    setRoute(next);
    window.scrollTo({ top: 0 });
  }, []);
  return { route, navigate };
}
