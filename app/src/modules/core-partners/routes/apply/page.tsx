"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle, ChevronDown } from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  "https://saturnusgo-backend-production.up.railway.app";
const PARTNER_APPLICATION_PATH = "/api/partners/list";

const interestOptions = [
  { key: "hotels", label: "Hotels" },
  { key: "restaurants", label: "Restaurants" },
  { key: "cafes", label: "Cafés" },
  { key: "events", label: "Events" },
] as const;

const businessTypes = [
  "Hotel",
  "Resort",
  "Restaurant",
  "Café",
  "Event Venue",
  "Experience Provider",
  "Other Service",
];

type InterestKey = (typeof interestOptions)[number]["key"];

type Interests = Record<InterestKey, boolean>;

type FormState = {
  companyName: string;
  companyType: string;
  website: string;
  contactName: string;
  email: string;
  phone: string;
  country: string;
  monthlyVolume: string;
  interests: Interests;
  agree: boolean;
};

type PartnerApplicationPayload = {
  companyName: string;
  companyType: string;
  website?: string;
  contactName: string;
  email: string;
  phone?: string;
  country?: string;
  city?: string;
  monthlyVolume?: number;
  interests: Interests;
  agree: boolean;
};

type ApiErrorBody = {
  success?: boolean;
  message?: string | string[];
};

const initialForm: FormState = {
  companyName: "",
  companyType: "Hotel",
  website: "",
  contactName: "",
  email: "",
  phone: "",
  country: "",
  monthlyVolume: "",
  interests: { hotels: true, restaurants: false, cafes: false, events: false },
  agree: false,
};

function resolveApiUrl(path: string) {
  const normalizedBase = `${API_BASE.replace(/\/+$/, "")}/`;
  return new URL(path.replace(/^\/+/, ""), normalizedBase).toString();
}

function splitLocation(value: string) {
  const [country, city] = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return { country, city };
}

function buildPayload(form: FormState): PartnerApplicationPayload {
  const location = splitLocation(form.country);
  const monthlyVolume =
    form.monthlyVolume.trim() === "" ? undefined : Number(form.monthlyVolume);

  return {
    companyName: form.companyName.trim(),
    companyType: form.companyType.trim(),
    website: form.website.trim() || undefined,
    contactName: form.contactName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim() || undefined,
    country: location.country,
    city: location.city,
    monthlyVolume: Number.isFinite(monthlyVolume) ? monthlyVolume : undefined,
    interests: form.interests,
    agree: form.agree,
  };
}

function parseApiMessage(body: ApiErrorBody | null, status: number) {
  if (Array.isArray(body?.message) && body.message.length > 0) {
    return body.message[0];
  }

  if (typeof body?.message === "string" && body.message.trim()) {
    return body.message;
  }

  return `Request failed with status ${status}`;
}

async function submitPartnerApplication(payload: PartnerApplicationPayload) {
  const response = await fetch(resolveApiUrl(PARTNER_APPLICATION_PATH), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
    credentials: "omit",
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? ((await response.json()) as ApiErrorBody)
    : null;

  if (!response.ok || body?.success === false) {
    throw new Error(parseApiMessage(body, response.status));
  }

  return body;
}

function isValidEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value);
}

export default function ApplyNowPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [businessTypeOpen, setBusinessTypeOpen] = useState(false);

  const updateField =
    (key: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((current) => ({ ...current, [key]: event.target.value }));
    };

  const toggleInterest = (key: InterestKey) => {
    setForm((current) => ({
      ...current,
      interests: { ...current.interests, [key]: !current.interests[key] },
    }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.companyName.trim())
      nextErrors.companyName = "Company name is required";
    if (!form.contactName.trim())
      nextErrors.contactName = "Contact name is required";
    if (!isValidEmail(form.email.trim()))
      nextErrors.email = "Valid email is required";
    if (!Object.values(form.interests).some(Boolean))
      nextErrors.interests = "Select at least one partner scenario";
    if (!form.agree)
      nextErrors.agree =
        "You must accept the terms before sending the application";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validate()) return;

    setSubmitting(true);
    setErrors({});

    try {
      await submitPartnerApplication(buildPayload(form));
      setSuccess(true);
      window.setTimeout(() => router.push("/partners"), 1500);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to send the application";
      setErrors({ general: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="partnerApplyPage">
      <section
        className="partnerApplyHero"
        aria-labelledby="partner-apply-title"
      >
        <button
          className="partnerBackButton"
          type="button"
          onClick={() => router.push("/partners")}
        >
          <ArrowLeft aria-hidden="true" />
          Partners
        </button>

        <div className="partnerApplyHeroInner">
          <p className="partnerApplyEyebrow">
            SaturnusGo / Partner application
          </p>
          <h1 id="partner-apply-title">Apply to become a partner.</h1>
          <p>
            Send the business profile, location, contact person, and the first
            partner scenario. The form stays focused: no unnecessary questions,
            no legacy onboarding noise.
          </p>
        </div>
      </section>

      <section
        className="partnerApplyContent"
        aria-label="Partner application form"
      >
        {success ? (
          <div className="partnerSuccessState" role="status">
            <CheckCircle aria-hidden="true" />
            <h2>Application sent.</h2>
            <p>
              We received the partner profile and will route it to the next
              review step.
            </p>
          </div>
        ) : (
          <form
            className="partnerApplicationForm"
            onSubmit={handleSubmit}
            noValidate
          >
            {errors.general && (
              <p className="partnerFormError" role="alert">
                {errors.general}
              </p>
            )}

            <div className="partnerFormGroup">
              <div className="partnerFormGroupHeader">
                <span>01</span>
                <h2>Business</h2>
              </div>

              <div className="partnerFormGrid">
                <label className="partnerField" htmlFor="companyName">
                  <span>Company name</span>
                  <input
                    id="companyName"
                    value={form.companyName}
                    onChange={updateField("companyName")}
                    placeholder="Hotel Aurora"
                    aria-invalid={!!errors.companyName}
                  />
                  {errors.companyName && <small>{errors.companyName}</small>}
                </label>

                <div
                  className="partnerField partnerSelectField"
                  onBlur={(event) => {
                    const nextTarget = event.relatedTarget;

                    if (
                      !(nextTarget instanceof Node) ||
                      !event.currentTarget.contains(nextTarget)
                    ) {
                      setBusinessTypeOpen(false);
                    }
                  }}
                >
                  <span id="companyTypeLabel">Business type</span>
                  <button
                    className="partnerSelectTrigger"
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={businessTypeOpen}
                    aria-labelledby="companyTypeLabel companyTypeValue"
                    onClick={() => setBusinessTypeOpen((value) => !value)}
                  >
                    <span id="companyTypeValue">{form.companyType}</span>
                    <ChevronDown aria-hidden="true" />
                  </button>

                  {businessTypeOpen && (
                    <div
                      className="partnerSelectMenu"
                      role="listbox"
                      aria-labelledby="companyTypeLabel"
                    >
                      {businessTypes.map((type) => {
                        const selected = type === form.companyType;

                        return (
                          <button
                            key={type}
                            className="partnerSelectOption"
                            type="button"
                            role="option"
                            aria-selected={selected}
                            data-selected={selected}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                              setForm((current) => ({
                                ...current,
                                companyType: type,
                              }));
                              setBusinessTypeOpen(false);
                            }}
                          >
                            {type}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <label className="partnerField" htmlFor="website">
                  <span>Website</span>
                  <input
                    id="website"
                    value={form.website}
                    onChange={updateField("website")}
                    placeholder="https://"
                  />
                </label>

                <label className="partnerField" htmlFor="monthlyVolume">
                  <span>Monthly volume</span>
                  <input
                    id="monthlyVolume"
                    value={form.monthlyVolume}
                    onChange={updateField("monthlyVolume")}
                    placeholder="450"
                    inputMode="numeric"
                  />
                </label>
              </div>
            </div>

            <div className="partnerFormGroup">
              <div className="partnerFormGroupHeader">
                <span>02</span>
                <h2>Contact</h2>
              </div>

              <div className="partnerFormGrid">
                <label className="partnerField" htmlFor="contactName">
                  <span>Contact name</span>
                  <input
                    id="contactName"
                    value={form.contactName}
                    onChange={updateField("contactName")}
                    placeholder="Full name"
                    aria-invalid={!!errors.contactName}
                  />
                  {errors.contactName && <small>{errors.contactName}</small>}
                </label>

                <label className="partnerField" htmlFor="email">
                  <span>Email</span>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={updateField("email")}
                    placeholder="name@company.com"
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && <small>{errors.email}</small>}
                </label>

                <label className="partnerField" htmlFor="phone">
                  <span>Phone</span>
                  <input
                    id="phone"
                    value={form.phone}
                    onChange={updateField("phone")}
                    placeholder="+54 11"
                  />
                </label>

                <label className="partnerField" htmlFor="country">
                  <span>Country & city</span>
                  <input
                    id="country"
                    value={form.country}
                    onChange={updateField("country")}
                    placeholder="Argentina, Buenos Aires"
                  />
                </label>
              </div>
            </div>

            <div className="partnerFormGroup">
              <div className="partnerFormGroupHeader">
                <span>03</span>
                <h2>Scenario</h2>
              </div>

              <div
                className="partnerScenarioOptions"
                role="group"
                aria-label="Partnership interests"
              >
                {interestOptions.map((option) => (
                  <button
                    key={option.key}
                    className="partnerScenarioOption"
                    type="button"
                    data-selected={form.interests[option.key]}
                    aria-pressed={form.interests[option.key]}
                    onClick={() => toggleInterest(option.key)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {errors.interests && (
                <p className="partnerInlineError">{errors.interests}</p>
              )}
            </div>

            <div className="partnerFormFooter">
              <label className="partnerAgreement">
                <input
                  type="checkbox"
                  checked={form.agree}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      agree: event.target.checked,
                    }))
                  }
                />
                <span>
                  I agree to be contacted about partnership opportunities and
                  have read the terms.
                </span>
              </label>
              {errors.agree && (
                <p className="partnerInlineError">{errors.agree}</p>
              )}

              <div className="partnerFormActions">
                <button
                  className="partnerSecondaryButton"
                  type="button"
                  onClick={() => router.push("/partners")}
                >
                  Back
                </button>
                <button
                  className="partnerPrimaryButton"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? "Sending" : "Submit application"}
                  {!submitting && <ArrowRight aria-hidden="true" />}
                </button>
              </div>
            </div>
          </form>
        )}
      </section>

      <style jsx global>{`
        .partnerApplyPage {
          --apply-bg: #080a0d;
          --apply-bg-soft: #0e1116;
          --apply-text: #f4f0e8;
          --apply-muted: rgba(244, 240, 232, 0.66);
          --apply-faint: rgba(244, 240, 232, 0.42);
          --apply-line: rgba(244, 240, 232, 0.12);
          --apply-line-soft: rgba(244, 240, 232, 0.07);
          --apply-surface: rgba(244, 240, 232, 0.055);
          --apply-surface-strong: rgba(244, 240, 232, 0.1);
          --apply-danger: #ff7f73;
          margin-top: calc(var(--app-header-h, 96px) * -1);
          min-height: 100vh;
          background:
            radial-gradient(
              circle at 58% -20%,
              rgba(244, 240, 232, 0.08),
              transparent 34rem
            ),
            linear-gradient(
              135deg,
              var(--apply-bg),
              var(--apply-bg-soft) 48%,
              var(--apply-bg)
            );
          color: var(--apply-text);
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .partnerApplyHero {
          position: relative;
          display: flex;
          min-height: 70svh;
          align-items: flex-end;
          padding: clamp(104px, 14svh, 168px) clamp(22px, 6vw, 88px)
            clamp(56px, 8vw, 98px);
          border-bottom: 1px solid var(--apply-line-soft);
        }

        .partnerApplyHero::before {
          content: "";
          position: absolute;
          inset: 0;
          opacity: 0.14;
          background-image:
            linear-gradient(rgba(244, 240, 232, 0.035) 1px, transparent 1px),
            linear-gradient(
              90deg,
              rgba(244, 240, 232, 0.035) 1px,
              transparent 1px
            );
          background-size: 72px 72px;
          pointer-events: none;
        }

        .partnerBackButton {
          position: absolute;
          top: clamp(92px, 12svh, 122px);
          left: clamp(22px, 6vw, 88px);
          z-index: 1;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          border: 0;
          background: transparent;
          color: var(--apply-faint);
          font-size: 12px;
          font-weight: 850;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          cursor: pointer;
          transition: color 180ms ease;
        }

        .partnerBackButton:hover {
          color: var(--apply-text);
        }

        .partnerBackButton svg {
          width: 16px;
          height: 16px;
        }

        .partnerApplyHeroInner {
          position: relative;
          z-index: 1;
          max-width: 1050px;
        }

        .partnerApplyEyebrow {
          margin: 0 0 24px;
          color: var(--apply-faint);
          font-size: 11px;
          font-weight: 850;
          letter-spacing: 0.34em;
          line-height: 1.4;
          text-transform: uppercase;
        }

        .partnerApplyHero h1 {
          max-width: 980px;
          margin: 0;
          color: var(--apply-text);
          font-size: clamp(64px, 11vw, 150px);
          font-weight: 900;
          letter-spacing: -0.085em;
          line-height: 0.85;
        }

        .partnerApplyHero p:not(.partnerApplyEyebrow) {
          max-width: 680px;
          margin: clamp(28px, 4vw, 48px) 0 0;
          color: var(--apply-muted);
          font-size: clamp(18px, 1.7vw, 22px);
          line-height: 1.6;
        }

        .partnerApplyContent {
          max-width: 1180px;
          margin: 0 auto;
          padding: clamp(64px, 8vw, 112px) clamp(22px, 6vw, 88px)
            clamp(96px, 11vw, 150px);
        }

        .partnerApplicationForm,
        .partnerSuccessState {
          border-top: 1px solid var(--apply-line);
        }

        .partnerFormGroup {
          display: grid;
          grid-template-columns: minmax(160px, 0.38fr) minmax(0, 1fr);
          gap: clamp(26px, 5vw, 72px);
          padding: clamp(34px, 5vw, 58px) 0;
          border-bottom: 1px solid var(--apply-line);
        }

        .partnerFormGroupHeader span {
          display: block;
          margin-bottom: 14px;
          color: var(--apply-faint);
          font-size: 12px;
          font-weight: 850;
          letter-spacing: 0.18em;
        }

        .partnerFormGroupHeader h2 {
          margin: 0;
          color: var(--apply-text);
          font-size: clamp(30px, 4vw, 54px);
          font-weight: 900;
          letter-spacing: -0.06em;
          line-height: 0.95;
        }

        .partnerFormGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 22px;
        }

        .partnerField {
          position: relative;
          display: flex;
          min-width: 0;
          flex-direction: column;
          gap: 10px;
        }

        .partnerField > span {
          color: var(--apply-faint);
          font-size: 11px;
          font-weight: 850;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .partnerField input,
        .partnerField textarea,
        .partnerSelectTrigger {
          width: 100%;
          border: 1px solid rgba(244, 240, 232, 0.13);
          border-radius: 22px;
          background:
            linear-gradient(
              180deg,
              rgba(244, 240, 232, 0.09),
              rgba(244, 240, 232, 0.045)
            ),
            rgba(8, 10, 13, 0.58);
          color: var(--apply-text);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.045),
            0 18px 42px rgba(0, 0, 0, 0.16);
          font: inherit;
          font-size: 16px;
          outline: 0;
          transition:
            border-color 180ms ease,
            background 180ms ease,
            box-shadow 180ms ease,
            transform 180ms ease;
        }

        .partnerField input,
        .partnerSelectTrigger {
          height: 62px;
          padding: 0 18px;
        }

        .partnerField textarea {
          min-height: 142px;
          padding: 18px;
          resize: vertical;
        }

        .partnerField input::placeholder,
        .partnerField textarea::placeholder {
          color: rgba(244, 240, 232, 0.34);
        }

        .partnerField input:hover,
        .partnerField textarea:hover,
        .partnerSelectTrigger:hover {
          border-color: rgba(244, 240, 232, 0.24);
          background:
            linear-gradient(
              180deg,
              rgba(244, 240, 232, 0.12),
              rgba(244, 240, 232, 0.06)
            ),
            rgba(8, 10, 13, 0.68);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.06),
            0 22px 52px rgba(0, 0, 0, 0.24);
        }

        .partnerField input:focus,
        .partnerField textarea:focus,
        .partnerSelectTrigger:focus-visible,
        .partnerSelectTrigger[aria-expanded="true"] {
          border-color: rgba(244, 240, 232, 0.42);
          background:
            linear-gradient(
              180deg,
              rgba(244, 240, 232, 0.14),
              rgba(244, 240, 232, 0.065)
            ),
            rgba(8, 10, 13, 0.76);
          box-shadow:
            0 0 0 4px rgba(244, 240, 232, 0.07),
            inset 0 1px 0 rgba(255, 255, 255, 0.07),
            0 24px 58px rgba(0, 0, 0, 0.28);
        }

        .partnerField input[aria-invalid="true"] {
          border-color: rgba(255, 127, 115, 0.55);
          box-shadow:
            0 0 0 4px rgba(255, 127, 115, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .partnerSelectTrigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          cursor: pointer;
          text-align: left;
        }

        .partnerSelectTrigger span {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .partnerSelectTrigger svg {
          width: 18px;
          height: 18px;
          color: var(--apply-faint);
          flex: 0 0 auto;
          transition: transform 180ms ease;
        }

        .partnerSelectTrigger[aria-expanded="true"] svg {
          transform: rotate(180deg);
        }

        .partnerSelectMenu {
          position: absolute;
          left: 0;
          right: 0;
          top: calc(100% + 10px);
          z-index: 20;
          display: grid;
          gap: 4px;
          padding: 8px;
          border: 1px solid rgba(244, 240, 232, 0.14);
          border-radius: 24px;
          background: linear-gradient(
            180deg,
            rgba(23, 27, 32, 0.98),
            rgba(10, 12, 15, 0.98)
          );
          box-shadow:
            0 28px 70px rgba(0, 0, 0, 0.48),
            inset 0 1px 0 rgba(255, 255, 255, 0.055);
          backdrop-filter: blur(18px);
        }

        .partnerSelectOption {
          min-height: 44px;
          padding: 0 14px;
          border: 0;
          border-radius: 16px;
          background: transparent;
          color: rgba(244, 240, 232, 0.72);
          font: inherit;
          font-size: 14px;
          font-weight: 720;
          text-align: left;
          cursor: pointer;
          transition:
            background 160ms ease,
            color 160ms ease,
            transform 160ms ease;
        }

        .partnerSelectOption:hover,
        .partnerSelectOption:focus-visible {
          background: rgba(244, 240, 232, 0.09);
          color: var(--apply-text);
          outline: 0;
          transform: translateX(2px);
        }

        .partnerSelectOption[data-selected="true"] {
          background: var(--apply-text);
          color: #080a0d;
        }

        .partnerField small,
        .partnerInlineError,
        .partnerFormError {
          color: var(--apply-danger);
          font-size: 13px;
          line-height: 1.45;
        }

        .partnerFormError {
          margin: 0;
          padding: 20px 0;
          border-bottom: 1px solid rgba(255, 127, 115, 0.22);
        }

        .partnerScenarioOptions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 28px;
        }

        .partnerScenarioOption {
          min-height: 48px;
          padding: 0 18px;
          border: 1px solid var(--apply-line);
          border-radius: 999px;
          background: transparent;
          color: var(--apply-muted);
          font-size: 13px;
          font-weight: 820;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition:
            background 180ms ease,
            color 180ms ease,
            border-color 180ms ease;
        }

        .partnerScenarioOption[data-selected="true"] {
          border-color: var(--apply-text);
          background: var(--apply-text);
          color: #080a0d;
        }

        .partnerFormFooter {
          padding-top: clamp(34px, 5vw, 54px);
        }

        .partnerAgreement {
          display: flex;
          max-width: 720px;
          align-items: flex-start;
          gap: 12px;
          color: var(--apply-muted);
          font-size: 15px;
          line-height: 1.55;
        }

        .partnerAgreement input {
          width: 19px;
          height: 19px;
          margin-top: 3px;
          accent-color: var(--apply-text);
          flex: 0 0 auto;
          cursor: pointer;
        }

        .partnerFormActions {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 14px;
          margin-top: 34px;
        }

        .partnerPrimaryButton,
        .partnerSecondaryButton {
          display: inline-flex;
          min-height: 54px;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 0 23px;
          border-radius: 999px;
          border: 1px solid transparent;
          font-size: 13px;
          font-weight: 850;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition:
            transform 180ms ease,
            background 180ms ease,
            border-color 180ms ease,
            opacity 180ms ease;
        }

        .partnerPrimaryButton {
          background: var(--apply-text);
          color: #080a0d;
        }

        .partnerPrimaryButton:disabled {
          cursor: not-allowed;
          opacity: 0.62;
        }

        .partnerSecondaryButton {
          background: transparent;
          color: var(--apply-text);
          border-color: var(--apply-line);
        }

        .partnerPrimaryButton:not(:disabled):hover,
        .partnerSecondaryButton:hover {
          transform: translateY(-2px);
        }

        .partnerPrimaryButton svg,
        .partnerSecondaryButton svg {
          width: 16px;
          height: 16px;
        }

        .partnerSuccessState {
          padding: clamp(54px, 7vw, 82px) 0;
        }

        .partnerSuccessState svg {
          width: 52px;
          height: 52px;
          margin-bottom: 24px;
          color: var(--apply-text);
        }

        .partnerSuccessState h2 {
          margin: 0;
          color: var(--apply-text);
          font-size: clamp(40px, 6vw, 82px);
          font-weight: 900;
          letter-spacing: -0.07em;
          line-height: 0.95;
        }

        .partnerSuccessState p {
          max-width: 560px;
          margin: 22px 0 0;
          color: var(--apply-muted);
          font-size: 18px;
          line-height: 1.65;
        }

        @media (max-width: 860px) {
          .partnerApplyHero {
            min-height: auto;
            padding-top: 132px;
          }

          .partnerApplyHero h1 {
            font-size: clamp(58px, 17vw, 104px);
          }

          .partnerFormGroup,
          .partnerFormGrid {
            grid-template-columns: 1fr;
          }

          .partnerFormActions {
            justify-content: stretch;
          }

          .partnerPrimaryButton,
          .partnerSecondaryButton {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
