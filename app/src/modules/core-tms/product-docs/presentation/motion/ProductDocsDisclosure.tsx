"use client";

import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import styles from "../product-docs.module.css";

type Props = { id?: string; className?: string; children: ReactNode };

export function ProductDocsDisclosure({ open, ...props }: Props & { open: boolean }) {
  return <AnimatePresence initial={false}>
    {open && <DisclosureBody {...props} />}
  </AnimatePresence>;
}

function DisclosureBody({ id, className, children }: Props) {
  const present = useIsPresent();
  const reduced = useReducedMotion();
  return <motion.div id={id} className={`${styles.disclosureRegion} ${className ?? ""}`}
    ref={(element) => { if (element) element.inert = !present; }} aria-hidden={!present || undefined}
    initial={{ height: 0, opacity: 0, overflow: "hidden" }}
    animate={{ height: "auto", opacity: 1, transitionEnd: { overflow: "visible" } }}
    exit={{ height: 0, opacity: 0, overflow: "hidden", transition: { duration: reduced ? 0 : .16 } }}
    transition={{ duration: reduced ? 0 : .22, ease: [.2, .7, .25, 1] }}>
    {children}
  </motion.div>;
}
