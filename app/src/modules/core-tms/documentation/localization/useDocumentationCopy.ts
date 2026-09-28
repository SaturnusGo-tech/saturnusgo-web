"use client";

import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { documentationCopy } from "./ui-copy";

export function useDocumentationCopy() {
  const { locale } = useTmsLocale();
  return documentationCopy[locale];
}
