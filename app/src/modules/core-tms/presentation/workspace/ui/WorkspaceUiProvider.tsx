"use client";

import { HeroUIProvider } from "@heroui/system";
import { addToast } from "@heroui/toast";
import { useEffect, useRef, type ReactNode } from "react";

export function WorkspaceUiProvider({ children, locale, notice }: { children: ReactNode; locale: string; notice: string }) {
  const lastNotice = useRef("");
  useEffect(() => {
    if (notice && notice !== lastNotice.current) addToast({ title: notice });
    lastNotice.current = notice;
  }, [notice]);
  return <HeroUIProvider locale={locale} reducedMotion="user" disableRipple>{children}</HeroUIProvider>;
}
