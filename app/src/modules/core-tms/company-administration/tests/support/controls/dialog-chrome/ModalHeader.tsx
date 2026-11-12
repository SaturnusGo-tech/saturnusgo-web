import React from "react";
import type { Props } from "../model/props";

export function ModalHeader({ children }: Props) {
  return <header>{children as React.ReactNode}</header>;
}
