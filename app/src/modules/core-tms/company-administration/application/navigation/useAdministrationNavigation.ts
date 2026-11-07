"use client";

import { useCallback, useEffect, useState } from "react";
import { transitionContent } from "../../../presentation/workspace/motion/transition/content-transition";

export type CompanyAdministrationTab = "company" | "audit" | "codex" | "sso";

export type AdministrationRoute = { readonly section?: "sandbox" | "admin" | "profile"; readonly id: string | null; readonly creating: boolean; readonly page?: CompanyAdministrationTab | "plan-requests" };
export function administrationPage(section: string | undefined, page: string | null): AdministrationRoute["page"] {
  if (section === "sandbox" && page === "plan-requests") return page;
  if (page === "company" || page === "audit" || page === "codex" || page === "sso") return page;
  return undefined;
}

function currentRoute(): AdministrationRoute {
  const query = new URLSearchParams(window.location.search);
  const section = window.location.pathname.split("/")[1];
  const page = administrationPage(section, query.get("page"));
  return { ...(section === "sandbox" || section === "admin" || section === "profile" ? { section } : {}), id: query.get("id"), creating: query.get("create") === "true", ...(page ? { page } : {}) };
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
    const previousQuery = new URLSearchParams(window.location.search);
    if (previousQuery.get("account") === "personal") {
      query.set("account", "personal");
      for (const key of ["workspaceId", "projectId"]) {
        const value = previousQuery.get(key);
        if (value && /^[A-Za-z0-9._:-]{1,128}$/.test(value)) query.set(key, value);
      }
    }
    const language = previousQuery.get("lang");
    if (language === "ru" || language === "en") query.set("lang", language);
    if (next.id) query.set("id", next.id);
    if (next.page) query.set("page", next.page);
    if (next.creating) query.set("create", "true");
    const commit = () => {
      const path = next.section ? `/${next.section}/` : window.location.pathname;
      window.history.pushState({}, "", `${path}${query.size ? `?${query}` : ""}`);
      setRoute(currentRoute());
      window.scrollTo({ top: 0 });
    };
    const previous = currentRoute();
    if (previous.section === "admin" && (!next.section || next.section === "admin") && !previous.page && !next.page) commit();
    else transitionContent(commit);
  }, []);
  return { route, navigate };
}
