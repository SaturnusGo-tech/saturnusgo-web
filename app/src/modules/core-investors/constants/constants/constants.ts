import type { Metadata } from "next";

export const CORE_INVESTORS_CTA_SECTION_ID = "cta";

export const CORE_INVESTORS_OPEN_DECK_EVENT_NAME = "open-deck";

export const CORE_INVESTORS_METADATA = {
  title: "Investors — SaturnusGo",
  description:
    "Focused overview for investors: problem, solution, market, GTM, traction, roadmap, and raise.",
  openGraph: {
    title: "Investors — SaturnusGo",
    description: "Problem → Solution → Market → GTM → Traction → Roadmap → Raise.",
    url: "https://saturnusgo.com/investors/",
    siteName: "SaturnusGo",
  },
  twitter: { card: "summary" },
} satisfies Metadata;
