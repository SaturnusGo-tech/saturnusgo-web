"use client";

import { useEffect, useState } from "react";
import { visitWorkspace } from "../../../state/navigation/browser/workspace-history";

type ProfileScreen = "profile" | "security" | "sessions";

/** Hash navigation keeps legacy security links and browser Back working in both shells. */
export function useProfileScreen() {
  const [screen, setScreen] = useState<ProfileScreen>("profile");
  useEffect(() => {
    const sync = () => setScreen(window.location.hash === "#security" ? "security" : window.location.hash === "#sessions" ? "sessions" : "profile");
    sync();
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, []);
  const navigate = (next: ProfileScreen) => {
    const url = new URL(window.location.href);
    url.hash = next === "profile" ? "" : next;
    visitWorkspace(`${url.pathname}${url.search}${url.hash}`);
  };
  return { screen, navigate };
}
