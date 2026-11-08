"use client";

import { HeroUIProvider } from "@heroui/system";
import { addToast, ToastProvider } from "@heroui/toast";
import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";
import styles from "./workspace-ui.module.css";

export function WorkspaceUiProvider({ children, locale, notice }: { children: ReactNode; locale: string; notice: string }) {
  const reduceMotion = useReducedMotion();
  const lastNotice = useRef("");
  useEffect(() => {
    if (notice && notice !== lastNotice.current) addToast({ title: notice });
    lastNotice.current = notice;
  }, [notice]);
  return <HeroUIProvider locale={locale} reducedMotion="user" disableRipple>
    {children}
    <ToastProvider placement="bottom-right" maxVisibleToasts={1} toastOffset={16} disableAnimation={reduceMotion ?? false}
      regionProps={{ className: styles.toastRegion }}
      toastProps={{ timeout: 3500, classNames: {
        base: styles.toast, motionDiv: styles.toastMotion, content: styles.toastContent,
        title: styles.toastTitle, icon: styles.toastIcon, closeButton: styles.toastClose, closeIcon: styles.closeIcon,
      } }} />
  </HeroUIProvider>;
}
