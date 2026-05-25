import type {
  CoreHomeExperienceStep,
  CoreHomeFaqItem,
  CoreHomeFeatureCard,
  CoreHomeHeroMetric,
  CoreHomeLazyMountConfig,
  CoreHomeNavigationLink,
  CoreHomeSectionCopy,
  CoreHomeSocialLink,
  CoreHomeTrustItem,
  WaitlistRegion,
  WaitlistRole,
} from "../../types";

export const CORE_HOME_ANCHOR_HASHES = ["feel", "experience"] as const;
export const CORE_HOME_CANONICAL_ANCHOR_ID = "feel" as const;
export const CORE_HOME_ANCHOR_FLASH_CLASS_NAME = "anchor-flash";
export const CORE_HOME_ANCHOR_FLASH_DURATION_MS = 1200;
export const CORE_HOME_EXPERIENCE_LAZY_MOUNT: CoreHomeLazyMountConfig = {
  rootMargin: "720px 0px",
  threshold: 0.12,
};
export const CORE_HOME_INVESTORS_PATHNAME = "/investors";
export const CORE_HOME_INVESTORS_LABEL = "For investors";
export const CORE_HOME_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  "https://saturnusgo-backend-production.up.railway.app";
export const CORE_HOME_HERO_WORDS = ["Move", "Plan", "Book", "Go"] as const;
export const CORE_HOME_NAVIGATION_LINKS: CoreHomeNavigationLink[] = [{ label: "Home", href: "/" }, { label: "Features", href: "/features" }, { label: "Partners", href: "/partners" }, { label: "FAQ", href: "/faq" }];
export const CORE_HOME_HERO_METRICS: CoreHomeHeroMetric[] = [{ value: "60+", label: "core flows mapped" }, { value: "300+", label: "use cases covered" }];
export const CORE_HOME_COPY = {
  value: {
    id: "value",
    kicker: "Key features",
    title: "Explore SaturnusGo features",
    subtitle:
      "Everything around movement, saved places, payments and travel planning is presented as one connected operating surface.",
  },
  feel: {
    id: "feel",
    kicker: "How it works",
    title: "Getting started with SaturnusGo",
    subtitle:
      "Follow three clear steps: create your workspace, build the trip context and execute the next action without switching apps.",
  },
  screens: {
    id: "screens",
    kicker: "Product surface",
    title: "A product that feels like a command board",
    subtitle:
      "Core flows are grouped around intent: where to go, how to move, what to save and how to pay.",
  },
  trust: {
    id: "trust",
    kicker: "Trust layer",
    title: "Operational trust from the first tap",
    subtitle:
      "Clear receipts, recoverable state, verified partners and local payment rails are designed into the product foundation.",
  },
  faq: {
    id: "faq",
    kicker: "FAQ",
    title: "Questions before early access",
    subtitle: "Short answers about the product, first regions, platforms and partner model.",
  },
  waitlist: {
    id: "waitlist",
    kicker: "Early access",
    title: "Choose the right plan for your team",
    subtitle:
      "Join the private launch list and receive beta access when the flow opens for your region and role.",
  },
  follow: {
    id: "follow",
    kicker: "Updates",
    title: "Follow the build",
    subtitle: "Product notes, launch progress and investor context.",
  },
} satisfies Record<string, CoreHomeSectionCopy>;
export const CORE_HOME_FEATURES: CoreHomeFeatureCard[] = [
  {
    icon: "▦",
    title: "Trip management",
    description: "Create pickup, destination and route context in one clear workspace.",
  },
  {
    icon: "◎",
    title: "Saved places",
    description: "Organize collections and return to important locations without friction.",
  },
  {
    icon: "▤",
    title: "Ride execution",
    description: "Preview class, ETA and price before the user commits to an order.",
  },
  {
    icon: "◧",
    title: "Wallet clarity",
    description: "Cards, balance, receipts and bonuses are visible in one financial layer.",
  },
  {
    icon: "✦",
    title: "AI planning",
    description: "Weekend ideas, places and next actions are shaped into a compact journey.",
  },
  {
    icon: "⌁",
    title: "Partner surface",
    description: "Hotels, events and local operators can plug into the same user intent.",
  },
];
export const CORE_HOME_EXPERIENCE_STEPS: CoreHomeExperienceStep[] = [
  {
    index: "01",
    title: "Customize your workspace",
    description: "Set your travel context: saved locations, wallet, preferred ride class and region.",
  },
  {
    index: "02",
    title: "Collaborate with your route",
    description: "Places, bookings, rides and events remain connected instead of becoming separate decisions.",
  },
  {
    index: "03",
    title: "Execute the next action",
    description: "Order, save, pay, share or continue planning from the same visual hierarchy.",
  },
];
export const CORE_HOME_SCREEN_PHRASES = [
  "Ride ordering",
  "Saved collections",
  "Wallet",
  "Hotels",
  "Events",
  "AI planner",
  "Receipts",
  "Bonuses",
  "Partners",
  "Local rails",
];
export const CORE_HOME_TRUST_ITEMS: CoreHomeTrustItem[] = [
  {
    label: "Payments",
    value: "Clear",
    description: "The payment source, bonus logic and receipt are visible before confirmation.",
  },
  {
    label: "State",
    value: "Recoverable",
    description: "Core flows are designed around reload, route recovery and predictable status changes.",
  },
  {
    label: "Partners",
    value: "Verified",
    description: "Drivers, hotels and locations are treated as controlled operational entities.",
  },
];
export const CORE_HOME_FAQ_ITEMS: CoreHomeFaqItem[] = [
  {
    id: "product",
    question: "Is SaturnusGo only a taxi app?",
    answer: "No. Rides are the core action, but the product connects places, planning, payments, bookings and partners around the same user journey.",
  },
  {
    id: "regions",
    question: "Which markets are first?",
    answer: "The first focus is LATAM, then MENA and Europe after the early operational loop is validated.",
  },
  {
    id: "platforms",
    question: "Will it support iOS and Android?",
    answer: "Yes. The product is mobile-first, with the same product logic and native-feeling UI across both platforms.",
  },
  {
    id: "investors",
    question: "Where can investors see the full context?",
    answer: "The investor page contains deck access, market logic, GTM, roadmap and projections in one structured view.",
  },
];
export const CORE_HOME_ROLES: WaitlistRole[] = ["Traveler", "Investor", "Driver/Fleet", "Hotel/Partner"];
export const CORE_HOME_REGIONS: WaitlistRegion[] = ["LATAM", "MENA", "EU", "UAE"];

export const CORE_HOME_SOCIAL_LINKS: CoreHomeSocialLink[] = [
  { label: "X / Twitter", shortLabel: "X", href: "https://x.com/saturnusgo?s=21" },
  {
    label: "Instagram",
    shortLabel: "IG",
    href: "https://www.instagram.com/saturnusgo?igsh=MTA4OXNuYTF5bGZmNw%3D%3D&utm_source=qr",
  },
  {
    label: "LinkedIn",
    shortLabel: "IN",
    href: "https://www.linkedin.com/in/mercury-rucks-1b1a11376?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app",
  },
];
