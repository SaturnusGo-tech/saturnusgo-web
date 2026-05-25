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

export type CoreHomeHeroMetric = {
  value: string;
  label: string;
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

export type CoreHomeTrustItem = {
  label: string;
  value: string;
  description: string;
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
