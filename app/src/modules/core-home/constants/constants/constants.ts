import type {
  CoreHomeExperienceStep,
  CoreHomeFaqItem,
  CoreHomeFeatureCard,
  CoreHomeFooterGroup,
  CoreHomeLazyMountConfig,
  CoreHomeNavigationLink,
  CoreHomePresenceCard,
  CoreHomeRideClass,
  CoreHomeSectionCopy,
  CoreHomeServiceModule,
  CoreHomeSocialLink,
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
export const CORE_HOME_HERO_LOADING_DURATION_MS = 1150;
export const CORE_HOME_INVESTORS_PATHNAME = "/investors";
export const CORE_HOME_INVESTORS_LABEL = "For investors";
export const CORE_HOME_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  "https://saturnusgo-backend-production.up.railway.app";

export const CORE_HOME_HERO_WORDS = ["Move", "Plan", "Book", "Go"] as const;
export const CORE_HOME_NAVIGATION_LINKS: CoreHomeNavigationLink[] = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/features" },
  { label: "Partners", href: "/partners" },
  { label: "FAQ", href: "/faq" },
];
export const CORE_HOME_COPY = {
  value: {
    id: "value",
    kicker: "Urban platform",
    title: "Taxi is the core. The city flow is the product.",
    subtitle:
      "SaturnusGo opens with movement, then keeps delivery, places and transport inside the same calm route-first hierarchy.",
  },
  feel: {
    id: "feel",
    kicker: "Motion system",
    title: "Scroll, expand and choose without losing context.",
    subtitle:
      "The home page uses slow reveal, active service expansion and a product carousel instead of static marketing blocks.",
  },
  screens: {
    id: "screens",
    kicker: "City flows",
    title: "Ride classes, delivery and places behave as one system.",
    subtitle:
      "Each product surface has its own image and action, but the page keeps the same visual grammar from top to bottom.",
  },
  trust: {
    id: "trust",
    kicker: "Presence",
    title: "Built for real city scenarios, not a generic app showcase.",
    subtitle:
      "Airport rides, daily routes, curated places and courier actions are presented as operational city zones.",
  },
  faq: {
    id: "faq",
    kicker: "FAQ",
    title: "Questions before early access",
    subtitle: "Short answers about the product, first regions, platforms, and partner model.",
  },
  waitlist: {
    id: "waitlist",
    kicker: "Early access",
    title: "Join the private SaturnusGo workspace",
    subtitle:
      "Request beta access and receive launch updates when the flow opens for your region and role.",
  },
  follow: {
    id: "follow",
    kicker: "Updates",
    title: "Follow the build",
    subtitle: "Product notes, launch progress, partner context, and investor updates.",
  },
} satisfies Record<string, CoreHomeSectionCopy>;

export const CORE_HOME_SERVICE_MODULES: CoreHomeServiceModule[] = [
  {
    id: "trips",
    index: "01",
    eyebrow: "TRIPS APPROACH",
    title: "Ride ordering",
    summary: "Fast taxi ordering with the route, price intent and next action visible from the first screen.",
    description:
      "The taxi module is the first product layer: pickup, destination, route confidence and class selection stay readable before the user commits.",
    action: "Start with rides",
    href: "#download-app",
    image: "/mock/module-trips.webp",
  },
  {
    id: "delivery",
    index: "02",
    eyebrow: "DELIVERY EXECUTION",
    title: "Courier delivery",
    summary: "Send small parcels, purchases and personal items without leaving the mobility context.",
    description:
      "Delivery reuses the same city logic as rides: clear origin, destination, status and timing without forcing users through a different product mental model.",
    action: "Open delivery flow",
    href: "#download-app",
    image: "/mock/module-delivery.jpg",
  },
  {
    id: "places",
    index: "03",
    eyebrow: "CITY DISCOVERY",
    title: "Curated places",
    summary: "Restaurants, walks, hotels and local points appear as decisions around the journey, not as noise.",
    description:
      "Places turn the app into a travel layer: saved collections, curated recommendations and destination detail cards support the ride instead of competing with it.",
    action: "Explore places",
    href: "#download-app",
    image: "/mock/module-places.jpg",
  },
  {
    id: "transport",
    index: "04",
    eyebrow: "TRANSPORT LAYER",
    title: "City transport",
    summary: "Compare movement options while keeping taxi as the primary high-confidence action.",
    description:
      "Transport gives context to the route: transfers, public options and city movement can sit beside ride ordering without breaking the hierarchy.",
    action: "See transport options",
    href: "#download-app",
    image: "/mock/module-transport.jpg",
  },
];

export const CORE_HOME_FEATURES: CoreHomeFeatureCard[] = [
  { icon: "01", title: "Trips", description: "Route-first ride ordering with a clear next action." },
  { icon: "02", title: "Delivery", description: "Courier flow built on the same city movement model." },
  { icon: "03", title: "Places", description: "Curated destinations attached to real journeys." },
];
export const CORE_HOME_EXPERIENCE_STEPS: CoreHomeExperienceStep[] = [
  { index: "01", title: "Intent first", description: "The first screen starts with where the user wants to go." },
  { index: "02", title: "Soft expand", description: "Service cards open without pushing the user out of context." },
  { index: "03", title: "Single action", description: "Every section resolves into one clean product action." },
];
export const CORE_HOME_RIDE_CLASSES: CoreHomeRideClass[] = [
  { id: "carpool", name: "Carpool", eyebrow: "Define ride", description: "A calm everyday taxi option for the first SaturnusGo action.", image: "/mock/module-trips.webp" },
  { id: "delivery", name: "Delivery", eyebrow: "Moment context", description: "Small parcels and personal items inside the same city route system.", image: "/mock/module-delivery.jpg" },
  { id: "places", name: "Places", eyebrow: "Destination layer", description: "Curated places around the user’s movement and saved collections.", image: "/mock/module-places.jpg" },
  { id: "transport", name: "Transport", eyebrow: "Movement context", description: "Route context for transfers, public transport and city alternatives.", image: "/mock/module-transport.jpg" },
];
export const CORE_HOME_SCREEN_PHRASES = ["Taxi", "Delivery", "Places", "Transport", "Airport", "Collections", "Routes", "City flow"];
export const CORE_HOME_PRESENCE_CARDS: CoreHomePresenceCard[] = [
  { city: "Buenos Aires", country: "Argentina", entity: "Launch city", detail: "Airport rides, daily routes and curated city points.", image: "/mock/hero-main.webp" },
  { city: "Airport", country: "Transfer flow", entity: "Ride intent", detail: "Pickup confidence, timing and luggage-friendly movement.", image: "/mock/module-trips.webp" },
  { city: "City center", country: "Places layer", entity: "Discovery", detail: "Restaurants, walks and saved destinations around the route.", image: "/mock/module-places.jpg" },
];
export const CORE_HOME_FAQ_ITEMS: CoreHomeFaqItem[] = [
  { id: "product", question: "Is SaturnusGo only a taxi app?", answer: "No. Taxi is the core action, while delivery, places and transport expand the same city journey." },
  { id: "regions", question: "Which markets are first?", answer: "The first focus is LATAM, then MENA and Europe after the early operational loop is validated." },
  { id: "platforms", question: "Will it support iOS and Android?", answer: "Yes. The product is mobile-first, with native-feeling UI across both platforms." },
  { id: "investors", question: "Where can investors see the full context?", answer: "The investor page contains deck access, market logic, GTM, roadmap and projections." },
];
export const CORE_HOME_ROLES: WaitlistRole[] = ["Traveler", "Investor", "Driver/Fleet", "Hotel/Partner"];
export const CORE_HOME_REGIONS: WaitlistRegion[] = ["LATAM", "MENA", "EU", "UAE"];
export const CORE_HOME_FOOTER_GROUPS: CoreHomeFooterGroup[] = [
  { title: "Product", links: [{ label: "Home", href: "/" }, { label: "Features", href: "/features" }, { label: "Mobile", href: "/mobile" }, { label: "Pricing", href: "/pricing" }] },
  { title: "Company", links: [{ label: "Founder", href: "/founder" }, { label: "Investors", href: "/investors" }, { label: "Press", href: "/press" }, { label: "Support", href: "/support" }] },
  { title: "Partners", links: [{ label: "Partners", href: "/partners" }, { label: "Listing", href: "/partners/listing" }, { label: "Apply", href: "/partners/apply" }, { label: "Contacts", href: "/partners/contacts" }] },
  { title: "Legal", links: [{ label: "Privacy", href: "/partners/privacy" }, { label: "Terms", href: "/partners/terms" }, { label: "Cookies", href: "/partners/cookies" }, { label: "Compliance", href: "/partners/compliance" }] },
];
export const CORE_HOME_SOCIAL_LINKS: CoreHomeSocialLink[] = [
  { label: "X / Twitter", shortLabel: "X", href: "https://x.com/saturnusgo?s=21" },
  { label: "Instagram", shortLabel: "IG", href: "https://www.instagram.com/saturnusgo?igsh=MTA4OXNuYTF5bGZmNw%3D%3D&utm_source=qr" },
  { label: "LinkedIn", shortLabel: "IN", href: "https://www.linkedin.com/in/mercury-rucks-1b1a11376?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app" },
];
