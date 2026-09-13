"use client";
import { motion, useIsPresent, useReducedMotion } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";
import styles from "../directory/directory.module.css";

export function AdministrationPanel({ children, label, busy, onClose }: {
  readonly children: ReactNode; readonly label: string; readonly busy: boolean; readonly onClose: () => void;
}) {
  const reduced = useReducedMotion();
  const present = useIsPresent();
  const panel = useRef<HTMLElement | null>(null);
  const origin = useRef<HTMLElement | null>(null);
  useEffect(() => {
    origin.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => { if (origin.current?.isConnected) origin.current.focus({ preventScroll: true }); };
  }, []);
  useEffect(() => { if (panel.current) panel.current.inert = !present; }, [present]);
  return <motion.section ref={panel} className={styles.panel} tabIndex={-1} aria-label={label} aria-hidden={!present || undefined}
    initial={{ x: reduced ? 0 : "100%" }} animate={{ x: 0 }} exit={{ x: reduced ? 0 : "100%" }}
    transition={{ duration: reduced ? 0 : .26, ease: [.22, .75, .25, 1] }}
    onAnimationComplete={() => { if (present && !panel.current?.contains(document.activeElement)) panel.current?.focus({ preventScroll: true }); }}
    onKeyDown={(event) => { if (event.key === "Escape" && !event.defaultPrevented && !busy) { event.preventDefault(); onClose(); } }}>
    {children}
  </motion.section>;
}
