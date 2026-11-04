"use client";
import { useEffect, useMemo } from "react";
import { createSpaceChoiceClient } from "../data/space-choice-client";
import { useSpaceChoice } from "../application/useSpaceChoice";
import { SpaceChoiceScreen } from "../presentation/SpaceChoiceScreen";
import { rememberBrowserContinuation } from "../../continuation/application/browser-continuation";
export function SpaceChoiceFeature() {
  const port = useMemo(() => createSpaceChoiceClient(), []);
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const model = useSpaceChoice(port, origin, process.env.NEXT_PUBLIC_FALCON_COMPANY_DOMAIN_SUFFIX ?? "saturnusgo.com");
  useEffect(() => {
    const url = new URL(window.location.href); url.searchParams.delete("chooseSpace");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);
  useEffect(() => {
    if (!model.state.destination) return;
    rememberBrowserContinuation(); window.location.assign(model.state.destination);
  }, [model.state.destination]);
  return <SpaceChoiceScreen model={model} />;
}
