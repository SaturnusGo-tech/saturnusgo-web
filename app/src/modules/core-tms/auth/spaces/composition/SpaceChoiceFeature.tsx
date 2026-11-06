"use client";
import { useEffect, useMemo } from "react";
import { createSpaceChoiceClient } from "../data/space-choice-client";
import { useSpaceChoice } from "../application/useSpaceChoice";
import { SpaceChoiceScreen } from "../presentation/SpaceChoiceScreen";
import { rememberBrowserContinuation } from "../../continuation/application/browser-continuation";
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
    if (destination.pathname === "/cloud-login/" && destination.searchParams.has("workspaceId")) {
      destination.searchParams.set("method", "company"); destination.searchParams.set("lang", locale);
      rememberBrowserContinuation(); window.location.assign(destination.href);
    } else { rememberBrowserContinuation(); window.location.assign(model.state.destination); }
  }, [model.state.destination, locale]);
  return <SpaceChoiceScreen model={model} />;
}
