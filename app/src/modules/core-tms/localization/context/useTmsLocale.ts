"use client";

import { useContext } from "react";
import { TmsLocaleContext } from "./TmsLocaleProvider";

export function useTmsLocale() {
  const context = useContext(TmsLocaleContext);
  if (!context) {
    throw new Error("useTmsLocale must be used within TmsLocaleProvider");
  }
  return context;
}
