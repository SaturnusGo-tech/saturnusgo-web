"use client";
import { TrialNotice } from "../../auth/sign-in/presentation/trial/TrialNotice";

/** Explicit local-only fixture; ui-preview itself is excluded from production. */
export function WelcomeDevelopmentPreview({ enabled }: { enabled: boolean }) {
  return process.env.NODE_ENV !== "production" && enabled ? <TrialNotice trial={{ kind: "personal",
    startsAt: "2026-11-04T12:00:00Z", expiresAt: "2026-11-11T12:00:00Z", readOnly: false }} /> : null;
}
