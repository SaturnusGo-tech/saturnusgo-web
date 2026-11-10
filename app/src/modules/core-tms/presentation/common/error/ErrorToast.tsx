"use client";

import { addToast, closeToast } from "@heroui/toast";
import { CircleAlert } from "lucide-react";
import React, { useEffect, useRef, type ReactNode } from "react";
import styles from "../../workspace/ui/workspace-ui.module.css";

type ErrorToastProps = {
  message?: string | null;
  title?: string;
  brand?: ReactNode;
  retryLabel?: string;
  onRetry?: () => void;
};

export function showErrorToast({ message, title, brand, retryLabel, onRetry }: ErrorToastProps): string | null {
  if (!message?.trim()) return null;

  const description = title && title !== message ? message : undefined;
  let key: string | null = null;
  let retryStarted = false;
  const errorIcon = <CircleAlert className={styles.errorMark} size={16} strokeWidth={1.75} aria-hidden="true" />;
  key = addToast({
    icon: (props: React.HTMLAttributes<HTMLElement>) => <span {...props} className={`${props.className ?? ""} ${styles.errorIcon}`}>{brand ?? errorIcon}</span>,
    title: brand ? <span className={styles.brandedToastTitle}><span>{title || message}</span>{errorIcon}</span> : title || message,
    description: retryLabel && onRetry ? (
      <span className={styles.toastDetails}>
        {description && <span>{description}</span>}
        <button className={styles.toastRetry} type="button" onClick={() => {
          if (retryStarted) return;
          retryStarted = true;
          if (key) closeToast(key);
          onRetry();
        }}>{retryLabel}</button>
      </span>
    ) : description,
    severity: "danger",
    timeout: 0,
    shouldShowTimeoutProgress: false,
    color: "danger",
  });
  return key;
}

/** Report an operation failure without replacing the content or shifting the layout. */
export function ErrorToast({ message, title, brand, retryLabel, onRetry }: ErrorToastProps) {
  const options = useRef({ brand, onRetry });
  useEffect(() => { options.current = { brand, onRetry }; }, [brand, onRetry]);
  const canRetry = Boolean(onRetry && retryLabel);

  useEffect(() => {
    const key = showErrorToast({ message, title, brand: options.current.brand, retryLabel, onRetry: canRetry ? () => options.current.onRetry?.() : undefined });
    return () => { if (key) closeToast(key); };
  }, [message, title, retryLabel, canRetry]);
  return null;
}
