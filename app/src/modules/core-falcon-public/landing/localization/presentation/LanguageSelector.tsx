"use client";

import dynamic from "next/dynamic";
import { LanguageTrigger } from "./LanguageTrigger";

// Keep HeroUI's overlay code out of the landing prerender.
export const LanguageSelector = dynamic(
  () => import("./LanguageMenu").then(module => module.LanguageMenu),
  { ssr: false, loading: () => <LanguageTrigger disabled /> },
);
