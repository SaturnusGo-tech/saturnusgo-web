"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  Building2,
  Briefcase,
  Check,
  ChevronDown,
  Coffee,
  MapPin,
  Mountain,
  Search,
  Sun,
  Ticket,
  UtensilsCrossed,
} from "lucide-react";

type PartnerStatus = "new" | "in_review" | "approved" | "rejected";

type Partner = {
  id: string;
  name: string;
  type?: string;
  location?: string;
  status?: PartnerStatus;
};

type PartnerApplication = {
  id: number;
  companyName: string;
  companyType: string;
  country?: string | null;
  city?: string | null;
  status: PartnerStatus;
};

type ListResponse = {
  success: boolean;
  page: number;
  limit: number;
  total: number;
  data: PartnerApplication[];
};

type TypeOption = {
  value: string;
  label: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  "https://saturnusgo-backend-production.up.railway.app";

const PARTNER_LIST_ENDPOINT = `${API_BASE}/api/partners/list`;

const TYPE_OPTIONS: TypeOption[] = [
  { value: "all", label: "All partner types" },
  { value: "Hotel", label: "Hotels" },
  { value: "Resort", label: "Resorts" },
  { value: "Event Venue", label: "Event venues" },
  { value: "Restaurant", label: "Restaurants" },
  { value: "Café", label: "Cafés" },
  { value: "Experience Provider", label: "Experience providers" },
  { value: "Other Service", label: "Other services" },
];

const PARTNER_LISTING_PRINCIPLES = [
  {
    title: "Verified supply",
    text: "Partners are shown as operational entries, not decorative logos. The list stays useful for real marketplace review.",
  },
  {
    title: "City context",
    text: "Every listing is readable by category, location and review state, so business teams can understand partner coverage fast.",
  },
  {
    title: "Clean access",
    text: "Search and category filtering stay close to the result set, without turning the page into a dashboard full of controls.",
  },
];

const STATUS_LABELS: Record<PartnerStatus, string> = {
  new: "New",
  in_review: "In review",
  approved: "Approved",
  rejected: "Rejected",
};

function getAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") {
    return {};
  }

  const token =
    localStorage.getItem("saturnusgo_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("access_token");

  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

function mapPartner(application: PartnerApplication): Partner {
  return {
    id: String(application.id),
    name: application.companyName,
    type: application.companyType,
    location: [application.city, application.country]
      .filter(Boolean)
      .join(", "),
    status: application.status,
  };
}

function TypeIcon({ type }: { type?: string }) {
  const normalizedType = (type || "").trim().toLowerCase();

  if (normalizedType === "hotel") {
    return <BedDouble aria-hidden="true" />;
  }

  if (normalizedType === "resort") {
    return <Sun aria-hidden="true" />;
  }

  if (normalizedType === "restaurant") {
    return <UtensilsCrossed aria-hidden="true" />;
  }

  if (normalizedType === "café" || normalizedType === "cafe") {
    return <Coffee aria-hidden="true" />;
  }

  if (normalizedType === "event venue") {
    return <Ticket aria-hidden="true" />;
  }

  if (normalizedType === "experience provider") {
    return <Mountain aria-hidden="true" />;
  }

  if (normalizedType === "other service") {
    return <Briefcase aria-hidden="true" />;
  }

  return <Building2 aria-hidden="true" />;
}

function PartnersTypeSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: TypeOption[];
  onChange: (nextValue: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedOption =
    options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className="partnerListingSelect">
      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="partnerListingSelectTrigger"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
      >
        <Building2 aria-hidden="true" />
        <span>{selectedOption.label}</span>
        <ChevronDown aria-hidden="true" data-open={isOpen} />
      </button>

      {isOpen && (
        <div className="partnerListingSelectMenu" role="listbox">
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                aria-selected={isSelected}
                className="partnerListingSelectOption"
                role="option"
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <span>{option.label}</span>
                {isSelected && <Check aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PartnerListingPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchPartners() {
      setLoading(true);
      setError(null);

      const limit = 200;
      let page = 1;
      let nextPartners: Partner[] = [];

      try {
        for (;;) {
          const response = await fetch(
            `${PARTNER_LIST_ENDPOINT}?page=${page}&limit=${limit}`,
            {
              method: "GET",
              headers: getAuthHeaders(),
              cache: "no-store",
              signal: abortController.signal,
            },
          );

          if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}`);
          }

          const payload = (await response.json()) as ListResponse;
          const batch = (payload.data || []).map(mapPartner);
          nextPartners = nextPartners.concat(batch);

          if (nextPartners.length >= payload.total || batch.length === 0) {
            break;
          }

          page += 1;
        }

        setPartners(nextPartners);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setError(`Failed to load partners. ${getErrorMessage(error)}`);
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchPartners();

    return () => abortController.abort();
  }, []);

  const filteredPartners = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    return partners.filter((partner) => {
      const matchesSearch = normalizedQuery
        ? [partner.name, partner.location, partner.type].some((value) =>
            value?.toLowerCase().includes(normalizedQuery),
          )
        : true;

      const matchesType = typeFilter === "all" || partner.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [partners, searchTerm, typeFilter]);

  return (
    <div className="partnerListingPage">
      <section className="partnerListingHero" aria-labelledby="partners-title">
        <div className="partnerListingHeroMedia" aria-hidden="true">
          <img src="/mock/module-places.jpg" alt="" />
        </div>

        <div className="partnerListingHeroInner">
          <span className="partnerListingEyebrow">Partner directory</span>
          <h1 id="partners-title">Verified partners for the city layer.</h1>
          <p>
            A clean operational view of hotels, restaurants, venues and local
            services connected to SaturnusGo partner flows.
          </p>
          <div className="partnerListingActions">
            <Link href="/partners/apply" className="partnerListingPrimaryLink">
              Apply as partner
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link href="/partners" className="partnerListingGhostLink">
              Partnership overview
            </Link>
          </div>
        </div>
      </section>

      <section className="partnerListingIntroSection">
        <div className="partnerListingSectionInner">
          <div className="partnerListingSectionHead">
            <span className="partnerListingEyebrow">How the list works</span>
            <div>
              <h2>Directory first, dashboard only where it helps.</h2>
              <p>
                This screen should be readable as a marketplace directory. The
                structure is light, searchable and grounded in real partner
                records rather than decorative cards.
              </p>
            </div>
          </div>

          <div className="partnerListingPrinciples">
            {PARTNER_LISTING_PRINCIPLES.map((principle, index) => (
              <div key={principle.title} className="partnerListingPrinciple">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{principle.title}</h3>
                <p>{principle.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="partnerListingResultsSection">
        <div className="partnerListingSectionInner">
          <div className="partnerListingToolbar">
            <div>
              <span className="partnerListingEyebrow">Browse partners</span>
              <h2>Find a partner by name, city or category.</h2>
            </div>

            <div className="partnerListingCount" aria-live="polite">
              <span>{filteredPartners.length}</span>
              <small>
                {filteredPartners.length === 1 ? "result" : "results"}
              </small>
            </div>
          </div>

          <div className="partnerListingFilters" role="search">
            <label className="partnerListingSearch">
              <Search aria-hidden="true" />
              <span className="sr-only">Search partners</span>
              <input
                type="search"
                placeholder="Search by partner, city or type"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            <PartnersTypeSelect
              options={TYPE_OPTIONS}
              value={typeFilter}
              onChange={setTypeFilter}
            />
          </div>

          {loading && (
            <div
              className="partnerListingState"
              role="status"
              aria-live="polite"
            >
              Loading partners…
            </div>
          )}

          {error && (
            <div
              className="partnerListingState partnerListingStateError"
              role="alert"
            >
              {error}
            </div>
          )}

          {!loading && !error && filteredPartners.length > 0 && (
            <div className="partnerListingRows">
              {filteredPartners.map((partner, index) => (
                <article key={partner.id} className="partnerListingRow">
                  <div className="partnerListingRowIndex">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className="partnerListingIcon">
                    <TypeIcon type={partner.type} />
                  </div>

                  <div className="partnerListingCompany">
                    <h3>{partner.name}</h3>
                    {partner.location && (
                      <p>
                        <MapPin aria-hidden="true" />
                        {partner.location}
                      </p>
                    )}
                  </div>

                  <div className="partnerListingMeta">
                    {partner.type && <span>{partner.type}</span>}
                    {partner.status && (
                      <small data-status={partner.status}>
                        {STATUS_LABELS[partner.status]}
                      </small>
                    )}
                  </div>

                  <Link href="/partners" className="partnerListingRowLink">
                    Learn more
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          )}

          {!loading && !error && filteredPartners.length === 0 && (
            <div className="partnerListingEmpty">
              <Search aria-hidden="true" />
              <h3>No partners to display</h3>
              <p>
                Change the search or category. Verified partners will appear
                here when they are available in the directory.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="partnerListingCtaSection">
        <div className="partnerListingSectionInner">
          <span className="partnerListingEyebrow">
            Become visible in the flow
          </span>
          <h2>
            Hotels, venues and city services can join the SaturnusGo partner
            layer.
          </h2>
          <p>
            Submit the application once. The team reviews fit, city coverage and
            the operational scenario before adding a partner to the ecosystem.
          </p>
          <Link href="/partners/apply" className="partnerListingPrimaryLink">
            Start application
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>

      <style jsx global>{`
        .partnerListingPage {
          --pl-night: #050505;
          --pl-paper: #f2eee4;
          --pl-paper-soft: #ebe5d8;
          --pl-ink: #080808;
          --pl-ink-soft: rgba(8, 8, 8, 0.66);
          --pl-ink-muted: rgba(8, 8, 8, 0.44);
          --pl-cream: #f7f4ee;
          --pl-cream-soft: rgba(247, 244, 238, 0.68);
          --pl-cream-muted: rgba(247, 244, 238, 0.45);
          --pl-line-light: rgba(8, 8, 8, 0.13);
          --pl-line-dark: rgba(247, 244, 238, 0.14);
          min-height: 100vh;
          margin-top: calc(var(--app-header-h, 96px) * -1);
          overflow-x: clip;
          background: var(--pl-paper);
          color: var(--pl-ink);
          font-family:
            var(--font-geist-sans), var(--font-pjs), system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
          text-rendering: geometricprecision;
        }

        .partnerListingHero {
          position: relative;
          min-height: min(760px, 100svh);
          display: grid;
          align-items: end;
          padding: calc(var(--app-header-h, 96px) + clamp(80px, 9vw, 132px))
            clamp(20px, 5vw, 72px) clamp(72px, 9vw, 128px);
          overflow: hidden;
          background: var(--pl-night);
          color: var(--pl-cream);
        }

        .partnerListingHero::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 1;
          background:
            linear-gradient(
              90deg,
              rgba(5, 5, 5, 0.94) 0%,
              rgba(5, 5, 5, 0.74) 44%,
              rgba(5, 5, 5, 0.44) 100%
            ),
            radial-gradient(
              circle at 78% 18%,
              rgba(145, 166, 188, 0.22),
              transparent 34rem
            );
        }

        .partnerListingHero::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 2;
          opacity: 0.18;
          background-image:
            linear-gradient(rgba(247, 244, 238, 0.04) 1px, transparent 1px),
            linear-gradient(
              90deg,
              rgba(247, 244, 238, 0.03) 1px,
              transparent 1px
            );
          background-size: 84px 84px;
          mask-image: linear-gradient(90deg, black 0%, transparent 74%);
        }

        .partnerListingHeroMedia {
          position: absolute;
          inset: 0;
          z-index: 0;
          transform: scale(1.035);
        }

        .partnerListingHeroMedia img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          filter: saturate(0.88) contrast(1.08) brightness(0.62);
        }

        .partnerListingHeroInner,
        .partnerListingSectionInner {
          width: min(1180px, 100%);
          margin: 0 auto;
        }

        .partnerListingHeroInner {
          position: relative;
          z-index: 3;
        }

        .partnerListingEyebrow {
          display: inline-block;
          margin: 0 0 20px;
          color: var(--pl-ink-muted);
          font-size: 12px;
          font-weight: 820;
          letter-spacing: 0.18em;
          line-height: 1.25;
          text-transform: uppercase;
        }

        .partnerListingHero .partnerListingEyebrow,
        .partnerListingCtaSection .partnerListingEyebrow {
          color: var(--pl-cream-muted);
        }

        .partnerListingHero h1,
        .partnerListingIntroSection h2,
        .partnerListingToolbar h2,
        .partnerListingCtaSection h2 {
          max-width: 980px;
          margin: 0;
          font-size: clamp(48px, 8vw, 124px);
          font-weight: 660;
          letter-spacing: -0.078em;
          line-height: 0.92;
        }

        .partnerListingIntroSection h2,
        .partnerListingToolbar h2,
        .partnerListingCtaSection h2 {
          font-size: clamp(42px, 6.4vw, 94px);
        }

        .partnerListingHero p,
        .partnerListingIntroSection p,
        .partnerListingCtaSection p {
          max-width: 720px;
          margin: 28px 0 0;
          color: var(--pl-cream-soft);
          font-size: clamp(17px, 1.55vw, 22px);
          line-height: 1.58;
        }

        .partnerListingIntroSection p {
          color: var(--pl-ink-soft);
        }

        .partnerListingActions {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 36px;
        }

        .partnerListingPrimaryLink,
        .partnerListingGhostLink,
        .partnerListingRowLink {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 50px;
          border-radius: 999px;
          padding: 0 22px;
          font-size: 13px;
          font-weight: 780;
          letter-spacing: 0.08em;
          text-decoration: none;
          text-transform: uppercase;
          transition:
            transform 180ms ease,
            background 180ms ease,
            color 180ms ease,
            border-color 180ms ease,
            box-shadow 180ms ease;
        }

        .partnerListingPrimaryLink {
          background: var(--pl-cream);
          color: var(--pl-ink);
        }

        .partnerListingGhostLink,
        .partnerListingRowLink {
          border: 1px solid currentColor;
          color: inherit;
        }

        .partnerListingPrimaryLink:hover,
        .partnerListingGhostLink:hover,
        .partnerListingRowLink:hover {
          transform: translateY(-2px);
        }

        .partnerListingPrimaryLink svg,
        .partnerListingGhostLink svg,
        .partnerListingRowLink svg {
          width: 16px;
          height: 16px;
        }

        .partnerListingIntroSection,
        .partnerListingResultsSection {
          padding: clamp(86px, 10vw, 142px) clamp(20px, 5vw, 72px);
          background: var(--pl-paper);
          color: var(--pl-ink);
        }

        .partnerListingSectionHead {
          display: grid;
          grid-template-columns: minmax(160px, 0.42fr) minmax(0, 1fr);
          gap: clamp(24px, 5vw, 76px);
          align-items: end;
          margin-bottom: clamp(42px, 6vw, 76px);
        }

        .partnerListingPrinciples {
          border-top: 1px solid var(--pl-line-light);
        }

        .partnerListingPrinciple {
          display: grid;
          grid-template-columns: 74px minmax(180px, 0.42fr) minmax(0, 1fr);
          gap: clamp(18px, 4vw, 62px);
          align-items: baseline;
          padding: clamp(24px, 3.6vw, 42px) 0;
          border-bottom: 1px solid var(--pl-line-light);
        }

        .partnerListingPrinciple span {
          color: var(--pl-ink-muted);
          font-size: 12px;
          font-weight: 820;
          letter-spacing: 0.18em;
        }

        .partnerListingPrinciple h3 {
          margin: 0;
          font-size: clamp(24px, 3vw, 42px);
          font-weight: 650;
          letter-spacing: -0.05em;
          line-height: 1;
        }

        .partnerListingPrinciple p {
          max-width: 660px;
          margin: 0;
          color: var(--pl-ink-soft);
          font-size: clamp(15px, 1.1vw, 18px);
          line-height: 1.62;
        }

        .partnerListingResultsSection {
          background: var(--pl-paper-soft);
        }

        .partnerListingToolbar {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 32px;
          align-items: end;
          margin-bottom: 34px;
        }

        .partnerListingCount {
          display: grid;
          justify-items: end;
          gap: 4px;
          color: var(--pl-ink-soft);
        }

        .partnerListingCount span {
          color: var(--pl-ink);
          font-size: clamp(52px, 6vw, 92px);
          font-weight: 620;
          letter-spacing: -0.078em;
          line-height: 0.88;
        }

        .partnerListingCount small {
          font-size: 12px;
          font-weight: 820;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .partnerListingFilters {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(260px, 340px);
          gap: 14px;
          margin-bottom: 28px;
        }

        .partnerListingSearch,
        .partnerListingSelectTrigger {
          min-height: 62px;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid rgba(8, 8, 8, 0.12);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.5);
          color: var(--pl-ink);
          box-shadow: 0 18px 48px rgba(8, 8, 8, 0.08);
          transition:
            border-color 180ms ease,
            box-shadow 180ms ease,
            transform 180ms ease,
            background 180ms ease;
        }

        .partnerListingSearch {
          padding: 0 20px;
        }

        .partnerListingSearch:focus-within,
        .partnerListingSelectTrigger:hover,
        .partnerListingSelectTrigger[aria-expanded="true"] {
          border-color: rgba(8, 8, 8, 0.28);
          background: rgba(255, 255, 255, 0.74);
          box-shadow: 0 24px 70px rgba(8, 8, 8, 0.13);
          transform: translateY(-1px);
        }

        .partnerListingSearch svg,
        .partnerListingSelectTrigger svg {
          width: 18px;
          height: 18px;
          flex: 0 0 auto;
          color: var(--pl-ink-muted);
        }

        .partnerListingSearch input {
          width: 100%;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: var(--pl-ink);
          font: inherit;
          font-size: 16px;
        }

        .partnerListingSearch input::placeholder {
          color: rgba(8, 8, 8, 0.38);
        }

        .partnerListingSelect {
          position: relative;
          z-index: 10;
        }

        .partnerListingSelectTrigger {
          width: 100%;
          justify-content: flex-start;
          padding: 0 18px;
          cursor: pointer;
          font: inherit;
          font-weight: 680;
        }

        .partnerListingSelectTrigger span {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-align: left;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .partnerListingSelectTrigger svg:last-child {
          transition: transform 180ms ease;
        }

        .partnerListingSelectTrigger svg:last-child[data-open="true"] {
          transform: rotate(180deg);
        }

        .partnerListingSelectMenu {
          position: absolute;
          inset: calc(100% + 10px) 0 auto 0;
          z-index: 20;
          display: grid;
          gap: 4px;
          padding: 8px;
          border: 1px solid rgba(8, 8, 8, 0.12);
          border-radius: 28px;
          background: #f7f4ee;
          box-shadow: 0 30px 90px rgba(8, 8, 8, 0.2);
        }

        .partnerListingSelectOption {
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border: 0;
          border-radius: 20px;
          padding: 0 14px;
          background: transparent;
          color: var(--pl-ink);
          cursor: pointer;
          font: inherit;
          font-size: 14px;
          font-weight: 660;
          text-align: left;
          transition:
            background 160ms ease,
            color 160ms ease;
        }

        .partnerListingSelectOption:hover,
        .partnerListingSelectOption:focus-visible {
          outline: 0;
          background: rgba(8, 8, 8, 0.08);
        }

        .partnerListingSelectOption[aria-selected="true"] {
          background: var(--pl-ink);
          color: var(--pl-cream);
        }

        .partnerListingSelectOption svg {
          width: 16px;
          height: 16px;
          flex: 0 0 auto;
        }

        .partnerListingRows {
          border-top: 1px solid var(--pl-line-light);
        }

        .partnerListingRow {
          display: grid;
          grid-template-columns:
            54px 74px minmax(0, 1fr) minmax(180px, 0.38fr)
            auto;
          gap: clamp(14px, 2.4vw, 32px);
          align-items: center;
          padding: clamp(22px, 3vw, 34px) 0;
          border-bottom: 1px solid var(--pl-line-light);
          color: var(--pl-ink);
          transition:
            transform 180ms ease,
            background 180ms ease,
            padding-inline 180ms ease;
        }

        .partnerListingRow:hover {
          transform: translateY(-2px);
          padding-inline: 18px;
          background: rgba(255, 255, 255, 0.34);
        }

        .partnerListingRowIndex {
          color: var(--pl-ink-muted);
          font-size: 12px;
          font-weight: 820;
          letter-spacing: 0.18em;
        }

        .partnerListingIcon {
          width: 58px;
          height: 58px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: rgba(8, 8, 8, 0.07);
          color: var(--pl-ink);
        }

        .partnerListingIcon svg {
          width: 24px;
          height: 24px;
          stroke-width: 1.65;
        }

        .partnerListingCompany h3 {
          margin: 0;
          color: var(--pl-ink);
          font-size: clamp(24px, 2.8vw, 40px);
          font-weight: 650;
          letter-spacing: -0.052em;
          line-height: 1;
        }

        .partnerListingCompany p {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin: 12px 0 0;
          color: var(--pl-ink-soft);
          font-size: 14px;
          line-height: 1.4;
        }

        .partnerListingCompany p svg {
          width: 15px;
          height: 15px;
          flex: 0 0 auto;
        }

        .partnerListingMeta {
          display: grid;
          justify-items: start;
          gap: 9px;
          color: var(--pl-ink-soft);
        }

        .partnerListingMeta span,
        .partnerListingMeta small {
          display: inline-flex;
          align-items: center;
          width: fit-content;
          min-height: 30px;
          border-radius: 999px;
          padding: 0 11px;
          font-size: 11px;
          font-weight: 820;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .partnerListingMeta span {
          border: 1px solid rgba(8, 8, 8, 0.12);
          color: var(--pl-ink-soft);
        }

        .partnerListingMeta small {
          background: rgba(8, 8, 8, 0.07);
          color: var(--pl-ink);
        }

        .partnerListingMeta small[data-status="approved"] {
          background: rgba(0, 120, 75, 0.12);
          color: #006b47;
        }

        .partnerListingMeta small[data-status="in_review"] {
          background: rgba(132, 96, 0, 0.13);
          color: #7a5600;
        }

        .partnerListingMeta small[data-status="rejected"] {
          background: rgba(150, 24, 24, 0.11);
          color: #8f1f1f;
        }

        .partnerListingRowLink {
          min-height: 42px;
          padding: 0 16px;
          color: var(--pl-ink);
          border-color: rgba(8, 8, 8, 0.16);
          white-space: nowrap;
        }

        .partnerListingRowLink:hover {
          background: var(--pl-ink);
          color: var(--pl-cream);
          border-color: var(--pl-ink);
        }

        .partnerListingState,
        .partnerListingEmpty {
          border-top: 1px solid var(--pl-line-light);
          border-bottom: 1px solid var(--pl-line-light);
          padding: 34px 0;
          color: var(--pl-ink-soft);
          font-size: 16px;
        }

        .partnerListingStateError {
          color: #8f1f1f;
        }

        .partnerListingEmpty {
          display: grid;
          justify-items: start;
          gap: 12px;
          padding: clamp(44px, 6vw, 74px) 0;
        }

        .partnerListingEmpty svg {
          width: 28px;
          height: 28px;
          color: var(--pl-ink-muted);
        }

        .partnerListingEmpty h3 {
          margin: 0;
          color: var(--pl-ink);
          font-size: clamp(28px, 3.6vw, 48px);
          font-weight: 650;
          letter-spacing: -0.055em;
        }

        .partnerListingEmpty p {
          max-width: 560px;
          margin: 0;
          color: var(--pl-ink-soft);
          font-size: 16px;
          line-height: 1.6;
        }

        .partnerListingCtaSection {
          padding: clamp(90px, 11vw, 150px) clamp(20px, 5vw, 72px);
          background: var(--pl-night);
          color: var(--pl-cream);
        }

        .partnerListingCtaSection p {
          margin-bottom: 34px;
        }

        .partnerListingCtaSection .partnerListingPrimaryLink {
          background: var(--pl-cream);
          color: var(--pl-ink);
        }

        @media (max-width: 980px) {
          .partnerListingSectionHead,
          .partnerListingPrinciple,
          .partnerListingToolbar,
          .partnerListingFilters,
          .partnerListingRow {
            grid-template-columns: 1fr;
          }

          .partnerListingToolbar {
            align-items: start;
          }

          .partnerListingCount {
            justify-items: start;
          }

          .partnerListingRow {
            gap: 14px;
          }

          .partnerListingRow:hover {
            padding-inline: 0;
            background: transparent;
          }

          .partnerListingRowLink {
            width: fit-content;
          }
        }

        @media (max-width: 640px) {
          .partnerListingHero h1 {
            font-size: clamp(46px, 15vw, 82px);
          }

          .partnerListingHero,
          .partnerListingIntroSection,
          .partnerListingResultsSection,
          .partnerListingCtaSection {
            padding-inline: 20px;
          }

          .partnerListingActions {
            align-items: stretch;
            flex-direction: column;
          }

          .partnerListingPrimaryLink,
          .partnerListingGhostLink {
            width: 100%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .partnerListingPrimaryLink,
          .partnerListingGhostLink,
          .partnerListingRowLink,
          .partnerListingSearch,
          .partnerListingSelectTrigger,
          .partnerListingRow {
            transition: none;
          }

          .partnerListingPrimaryLink:hover,
          .partnerListingGhostLink:hover,
          .partnerListingRowLink:hover,
          .partnerListingRow:hover {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
