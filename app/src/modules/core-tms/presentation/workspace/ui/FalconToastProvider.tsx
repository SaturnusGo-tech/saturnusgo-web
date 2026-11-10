"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion";
import styles from "./workspace-ui.module.css";

const ToastProvider = dynamic(() => import("@heroui/toast").then(module => module.ToastProvider), { ssr: false });

export function FalconToastProvider() {
  const reduceMotion = useReducedMotion();
  // Keep the provider mounted so the last toast can finish its exit animation.
  return <ToastProvider placement="bottom-right" maxVisibleToasts={3} toastOffset={16}
    disableAnimation={reduceMotion ?? false} regionProps={{ className: styles.toastRegion }}
    toastProps={{ timeout: 3500, classNames: {
      base: styles.toast, motionDiv: styles.toastMotion, content: styles.toastContent,
      wrapper: styles.toastWrapper, title: styles.toastTitle, description: styles.toastDescription,
      icon: styles.toastIcon, closeButton: styles.toastClose, closeIcon: styles.closeIcon,
    } }} />;
}
