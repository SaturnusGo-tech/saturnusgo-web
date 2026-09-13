import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import styles from "../../../tms.module.css";

/** Keep viewport overlays outside nested container-query stacking contexts. */
export function AppOverlay({ children }: { children: ReactNode }) {
  const anchor = useRef<HTMLSpanElement>(null);
  const [host, setHost] = useState<Element | null>(null);
  useLayoutEffect(() => {
    setHost(anchor.current?.closest(`.${styles.app}`) ?? document.body);
  }, []);
  return <><span ref={anchor} hidden />{host && createPortal(children, host)}</>;
}
