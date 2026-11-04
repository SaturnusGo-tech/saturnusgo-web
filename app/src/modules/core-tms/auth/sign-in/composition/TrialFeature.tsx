"use client";
import { useEffect, useState } from "react";
import { createSignInClient } from "../data/sign-in-client";
import type { TrialStatus } from "../domain/sign-in";
import { TrialNotice } from "../presentation/trial/TrialNotice";

export function TrialFeature() {
  const [trial, setTrial] = useState<TrialStatus | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void createSignInClient().trial(controller.signal).then(value => {
      if (!controller.signal.aborted) setTrial(value);
    }).catch(() => { /* The workspace keeps its server-enforced access policy if the notice cannot load. */ });
    return () => controller.abort();
  }, []);
  return trial ? <TrialNotice trial={trial} /> : null;
}
