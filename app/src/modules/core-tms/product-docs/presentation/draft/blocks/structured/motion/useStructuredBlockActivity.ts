"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const showAfter = 140;
export const structuredBlockExitMs = 160;

export function useStructuredBlockActivity(pending: boolean, active: boolean) {
  const [shown, setShown] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!active || (!pending && reduced)) {
      if (shown) setShown(false);
      return;
    }
    if (pending === shown) return;
    const timer = setTimeout(() => setShown(pending), pending ? showAfter : structuredBlockExitMs);
    return () => clearTimeout(timer);
  }, [active, pending, reduced, shown]);

  const phase = active && shown ? pending ? "solving" : reduced ? undefined : "leaving" : undefined;
  return { phase, reveal: !pending && !phase } as const;
}
