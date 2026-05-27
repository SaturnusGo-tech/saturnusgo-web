import type { RefObject, ReactNode } from "react";

export type CoreHomeAnchorTarget = "feel";

export type CoreHomeAnchorInput = {
  hash: string;
  search: string;
};

export type CoreHomeLazyMountConfig = {
  rootMargin: string;
  threshold: number;
};

export type CoreHomeSectionCopy = {
  id: string;
  kicker: string;
  title: string;
  subtitle: string;
};

export type CoreHomeControllerModel = {
  pathname: string | null;
  shouldMountExperience: boolean;
  experienceMountRef: RefObject<HTMLDivElement | null>;
};

export type CoreHomeViewProps = CoreHomeControllerModel;

export type CoreHomeNavigationLink = {
  label: string;
  href: string;
};

export type CoreHomeFeatureCard = {
  icon: string;
  title: string;
  description: string;
};

export type CoreHomeExperienceStep = {
  index: string;
  title: string;
  description: string;
};

export type CoreHomeServiceModule = {
  id: "trips" | "delivery" | "places" | "transport";
  index: string;
  eyebrow: string;
  title: string;
  summary: string;
  description: string;
  action: string;
  href: string;
  image: string;
};

export type CoreHomeRideClass = {
  id: string;
  name: string;
  eyebrow: string;
  description: string;
  image: string;
};

export type CoreHomePresenceCard = {
  city: string;
  country: string;
  entity: string;
  detail: string;
  image: string;
};

export type CoreHomeFooterGroup = {
  title: string;
  links: CoreHomeNavigationLink[];
};

export type CoreHomeFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type CoreHomeSocialLink = {
  label: string;
  href: string;
  shortLabel: string;
};

export type CoreHomeSectionProps = CoreHomeSectionCopy & {
  children: ReactNode;
  titleAside?: ReactNode;
  className?: string;
};

export type WaitlistTone = "dark" | "light";

export type WaitlistRole = "Traveler" | "Investor" | "Driver/Fleet" | "Hotel/Partner";

export type WaitlistRegion = "LATAM" | "MENA" | "EU" | "UAE";

export type WaitlistSubmitState = "idle" | "loading" | "ok" | "error";

export type WaitlistPayload = {
  name: string;
  email: string;
  role: WaitlistRole;
  region: WaitlistRegion;
};

export type WaitlistApiResponse = {
  message?: string | string[];
};

export type WaitlistCountOptions = {
  apiBase?: string;
  refreshIntervalMs?: number;
  immediate?: boolean;
};

export type WaitlistCounterProps = {
  className?: string;
  label?: string;
  apiBase?: string;
  refreshIntervalMs?: number;
  immediate?: boolean;
  locales?: string | string[];
  numberFormat?: Intl.NumberFormatOptions;
  hidePulse?: boolean;
};

export type SocialLinksProps = {
  size?: "sm" | "lg";
  children?: ReactNode;
  compact?: boolean;
  scroll?: boolean;
  className?: string;
};
