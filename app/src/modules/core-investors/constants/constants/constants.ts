import type { Metadata } from "next";

export const CORE_INVESTORS_CTA_SECTION_ID = "cta";

export const CORE_INVESTORS_OPEN_DECK_EVENT_NAME = "open-deck";

export const CORE_INVESTORS_HERO_LOADING_DURATION_MS = 820;

export const CORE_INVESTORS_METADATA = {
  title: "Investors — SaturnusGo",
  description:
    "Investor page for SaturnusGo: product thesis, market model, business mechanics, GTM, and deck access.",
  openGraph: {
    title: "Investors — SaturnusGo",
    description:
      "Product thesis, market model, business mechanics, GTM, and deck access.",
    url: "https://saturnusgo.com/investors/",
    siteName: "SaturnusGo",
  },
  twitter: { card: "summary" },
} satisfies Metadata;

export const CORE_INVESTORS_THESIS_ROWS = [
  {
    label: "Problem",
    text: "Urban movement is fragmented: people switch between ride apps, maps, delivery tools, saved places, payments, and support.",
  },
  {
    label: "Product",
    text: "SaturnusGo brings trips, delivery, places, routes, and wallet flows into one calm city interface.",
  },
  {
    label: "Wedge",
    text: "Start with high-frequency mobility, then expand through repeat routes, saved destinations, local partners, and city discovery.",
  },
] as const;

export const CORE_INVESTORS_SIGNAL_ROWS = [
  {
    label: "Why now",
    text: "People already expect mobility, payments, discovery, and support to feel connected. The market still gives them separate tools.",
  },
  {
    label: "Frequency",
    text: "Rides create the first habit. Delivery, places, airport flows, and saved destinations make the habit more durable.",
  },
  {
    label: "Model",
    text: "The projections section shows the 3, 5, and 10 year view directly on the page, so the assumptions stay visible.",
  },
  {
    label: "Proof",
    text: "Before scale, closed cohorts must show repeat use, operational reliability, support quality, and paid conversion.",
  },
] as const;

export const CORE_INVESTORS_MODEL_ROWS = [
  {
    label: "Revenue",
    text: "Trip commission, delivery fees, local discovery, subscriptions, partner integrations, and selected B2B2C surfaces.",
  },
  {
    label: "Retention",
    text: "Saved places, repeated routes, airport flows, and delivery context connect one daily use case to the next.",
  },
  {
    label: "Distribution",
    text: "Fleets, couriers, venues, local communities, and partner routes create the first supply and demand loops.",
  },
] as const;

export const CORE_INVESTORS_GTM_ROWS = [
  {
    label: "Now",
    text: "Polish the product surface and run private city cohorts around repeat movement.",
  },
  {
    label: "Next",
    text: "Validate supply density, support discipline, route quality, and delivery reliability.",
  },
  {
    label: "Then",
    text: "Scale only where repeat behavior and local operating quality are already visible.",
  },
] as const;

export const CORE_INVESTORS_MARQUEE_PHRASES = [
  "Product thesis",
  "3 year baseline",
  "5 year target",
  "10 year outlook",
  "Trips",
  "Delivery",
  "Places",
  "City corridors",
  "Partner loops",
  "Market model",
] as const;

export const CORE_INVESTORS_CONTENT_SECTIONS = [
  {
    id: "intro",
    kicker: "Investor context",
    title: "A taxi-first product that can become a city layer.",
    description:
      "The page explains the company without turning the screen into a grid of cards: thesis first, model next, then mechanics and rollout logic.",
    rows: CORE_INVESTORS_SIGNAL_ROWS,
  },
  {
    id: "model",
    kicker: "Business mechanics",
    title: "Revenue and retention come from the same city intent.",
    description:
      "The product does not try to win attention with noise. It makes the next movement decision easier and more repeatable.",
    rows: CORE_INVESTORS_MODEL_ROWS,
  },
  {
    id: "gtm",
    kicker: "GTM",
    title: "Prove repeat behavior before scaling the surface.",
    description:
      "Launch discipline matters more than broad availability. The first market needs density, reliability, and a product people return to.",
    rows: CORE_INVESTORS_GTM_ROWS,
  },
] as const;
