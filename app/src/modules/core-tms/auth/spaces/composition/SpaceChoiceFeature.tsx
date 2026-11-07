"use client";
import { useEffect, useMemo } from "react";
import { createSpaceChoiceClient } from "../data/space-choice-client";
import { useSpaceChoice } from "../application/useSpaceChoice";
import { SpaceChoiceScreen } from "../presentation/SpaceChoiceScreen";
import { peekBrowserContinuation, rememberBrowserContinuation } from "../../continuation/application/browser-continuation";
import { continuationFromLocation, scopedPlanContinuation, setPlanRequestIntent } from "../../continuation/domain/continuation-path";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
export function SpaceChoiceFeature() {
  const { locale } = useTmsLocale();
  const port = useMemo(() => createSpaceChoiceClient(), []);
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const model = useSpaceChoice(port, origin, process.env.NEXT_PUBLIC_FALCON_COMPANY_DOMAIN_SUFFIX ?? "saturnusgo.com");
  useEffect(() => {
    const url = new URL(window.location.href); url.searchParams.delete("chooseSpace");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);
  useEffect(() => {
    if (!model.state.destination) return;
    const destination = new URL(model.state.destination, window.location.origin);
    const workspaceId = destination.searchParams.get("workspaceId");
    if (destination.pathname === "/cloud-login/" && workspaceId) {
      if (destination.searchParams.get("workspaceHandoff") !== "1") destination.searchParams.set("method", "company");
      destination.searchParams.set("lang", locale);
      const current = continuationFromLocation(window.location);
      const plan = scopedPlanContinuation(current, origin, workspaceId)
        ?? scopedPlanContinuation(peekBrowserContinuation(workspaceId), origin, workspaceId);
      if (plan) {
        destination.searchParams.set("view", "config");
        destination.searchParams.set("settings", "billing");
        setPlanRequestIntent(destination.searchParams, plan);
      }
      rememberBrowserContinuation(); window.location.assign(destination.href);
    } else { rememberBrowserContinuation(); window.location.assign(model.state.destination); }
  }, [model.state.destination, locale, origin]);
  return <SpaceChoiceScreen model={model} />;
}
