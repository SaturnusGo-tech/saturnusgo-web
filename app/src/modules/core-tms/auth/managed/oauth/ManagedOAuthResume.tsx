"use client";

import { useEffect, useState, type ReactNode } from "react";
import { TmsAuthState } from "../../presentation/state/TmsAuthState";
import { oauthInteractionTarget } from "./navigation/oauth-interaction-target";

export function ManagedOAuthResume({ children }: { readonly children: ReactNode }) {
  const [target] = useState(() => typeof window === "undefined" ? null : oauthInteractionTarget(window.location.search));
  useEffect(() => {
    if (target) window.location.replace(target);
  }, [target]);
  return target ? <TmsAuthState kind="loading" /> : children;
}
