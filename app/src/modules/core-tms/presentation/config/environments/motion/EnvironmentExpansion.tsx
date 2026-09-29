import { useRef, type ReactNode } from "react";
import { useDisclosureMotion } from "../../../common/disclosure/useDisclosureMotion";

/** Native shared-element morph where available; measured expansion as a fallback. */
export function EnvironmentExpansion({ children }: { children?: ReactNode }) {
  const open = Boolean(children);
  const native = typeof document !== "undefined" && "startViewTransition" in document;
  const disclosure = useDisclosureMotion(open && !native, true);
  const retained = useRef<ReactNode>(children);
  if (children) retained.current = children;
  return <div ref={element => { disclosure.ref.current = element; if (element) element.inert = !open; }} aria-hidden={!open || undefined}>
    {(open || (!native && disclosure.present)) ? retained.current : null}
  </div>;
}
