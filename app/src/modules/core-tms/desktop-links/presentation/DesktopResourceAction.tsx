"use client";

import { Button } from "@heroui/button";
import { useEffect, useState } from "react";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { browserResourceOpener, supportsDesktopResourceOpen } from "../application/desktop-resource-open";
import { desktopResourceLink } from "../domain/resource-address";

export function DesktopResourceAction() {
  const { locale } = useTmsLocale();
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    const refresh = () => setAvailable(supportsDesktopResourceOpen(navigator.userAgent)
      && desktopResourceLink(window.location.href) !== null);
    refresh();
    window.addEventListener("popstate", refresh);
    window.addEventListener("falcon:navigation", refresh);
    return () => {
      window.removeEventListener("popstate", refresh);
      window.removeEventListener("falcon:navigation", refresh);
    };
  }, []);
  if (!available) return null;
  return <Button type="button" size="sm" radius="full" variant="light" data-testid="open-falcon-desktop"
    onPress={() => browserResourceOpener()(window.location.href, "explicit")}>
    {locale === "ru" ? "Открыть Falcon" : "Open Falcon"}
  </Button>;
}
