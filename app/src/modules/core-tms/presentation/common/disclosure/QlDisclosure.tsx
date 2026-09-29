import type { ReactNode } from "react";
import { useDisclosureMotion } from "./useDisclosureMotion";

export function QlDisclosure({ open, children }: { open: boolean; children: ReactNode }) {
  const motion = useDisclosureMotion(open, true);
  return motion.present ? <div data-ql-disclosure aria-hidden={!open || undefined}
    style={{ gridColumn: "1 / -1", minWidth: 0 }}
    ref={element => { motion.ref.current = element; if (element) element.inert = !open; }}>
    <div style={{ paddingTop: 7 }}>{children}</div>
  </div> : null;
}
