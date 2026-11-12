import React from "react";
import type { Props } from "../model/props";

export function ModalBody({ children }: Props) {
  return <div>{children as React.ReactNode}</div>;
}
