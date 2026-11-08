"use client";

import { useEffect, useState } from "react";
import type { BillingPlanId } from "../../../domain/billing";
import { readPlanRequestIntent, withoutPlanRequestIntent } from "../../domain/plan-request";

export function usePlanRequestIntent(workspaceId: string) {
  const [offer, setOffer] = useState<BillingPlanId | null>(null);
  const [intent, setIntent] = useState<ReturnType<typeof readPlanRequestIntent>>(null);
  useEffect(() => {
    if (typeof window !== "undefined") setIntent(readPlanRequestIntent(window.location?.search ?? ""));
  }, [workspaceId]);
  const deepRequestId = intent?.kind === "request" && intent.workspaceId === workspaceId ? intent.id : null;

  function clearIntent() {
    if (!intent) return;
    setIntent(null);
    window.history.replaceState(window.history.state, "", withoutPlanRequestIntent(window.location.href));
  }
  const openOffer = offer ?? (intent?.kind === "offer" ? intent.planId : null);
  return { openOffer, setOffer, clearIntent, deepRequestId };
}
