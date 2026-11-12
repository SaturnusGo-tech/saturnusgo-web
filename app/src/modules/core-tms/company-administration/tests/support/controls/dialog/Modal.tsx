import React from "react";
import type { Props } from "../model/props";
import { CloseContext } from "./modal-close-context";

export function Modal(props: Props) {
  if (props.isOpen === false) return null;
  const close = () => {
    if (typeof props.onClose === "function") props.onClose();
    else (props.onOpenChange as ((open: boolean) => void) | undefined)?.(false);
  };
  return <CloseContext.Provider value={close}><div role="dialog" aria-label={props["aria-label"] as string | undefined}>
    {props.children as React.ReactNode}
  </div></CloseContext.Provider>;
}
