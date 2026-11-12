import React from "react";
import type { Props } from "../model/props";

export function ModalFooter({ children }: Props) {
  return <footer>{children as React.ReactNode}</footer>;
}
