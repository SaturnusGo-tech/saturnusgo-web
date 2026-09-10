"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { LegacyTmsAuthBoundary } from "./LegacyTmsAuthBoundary";
import { ManagedWorkspaceBoundary } from "../../managed/composition/ManagedWorkspaceBoundary";
import { TmsAuthState } from "../state/TmsAuthState";

export function TmsAuthBoundary({ children }: { readonly children: ReactNode }) {
  const [managed, setManaged] = useState<boolean | null>(null);
  useEffect(() => {
    setManaged(document.querySelector('meta[name="falcon-access"]')?.getAttribute("content") === "managed"
      || (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_FALCON_MANAGED_AUTH === "true"));
  }, []);
  if (managed === null) return <TmsAuthState kind="loading" />;
  return managed ? <ManagedWorkspaceBoundary>{children}</ManagedWorkspaceBoundary>
    : <LegacyTmsAuthBoundary>{children}</LegacyTmsAuthBoundary>;
}
