import React, { useContext } from "react";
import type { Props } from "../model/props";
import { CloseContext } from "../dialog/modal-close-context";

export function ModalContent({ children }: Props) {
  const close = useContext(CloseContext);
  return <div>{typeof children === "function" ? children(close) : children}</div>;
}
