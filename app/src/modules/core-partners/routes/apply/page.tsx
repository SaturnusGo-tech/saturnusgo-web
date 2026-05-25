// app/partners/apply/page.tsx
"use client"

import type React from "react"

import { useRef, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { ArrowRight, Building2, Globe2, Mail, Phone, User, MapPin, CheckCircle } from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://saturnusgo-backend-production.up.railway.app"

const BackgroundEffects = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div
      className="absolute inset-0 opacity-[0.02]"
      style={{
        backgroundImage: `
          linear-gradient(var(--grid) 1px, transparent 1px),
          linear-gradient(90deg, var(--grid) 1px, transparent 1px)
        `,
        backgroundSize: "32px 32px",
      }}
    />
    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl animate-pulse" />
    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-indigo-500/5 to-cyan-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
  </div>
)

// ↑ рядом с импортами добавь типы
type Interests = {
  hotels: boolean
  restaurants: boolean
  cafes: boolean
  events: boolean
}
type FormState = {
  companyName: string
  companyType: string
  website: string
  contactName: string
  email: string
  phone: string
  country: string // "Country, City" одним полем
  city: string // отдельное поле в стейте (может быть пустым)
  interests: Interests
  monthlyVolume: string
  notes: string
  agree: boolean
}

type ListResponse = {
  success: boolean
  page: number
  limit: number
  total: number
  data: any[]
}

const PARTNER_LIST_ENDPOINT = `${API_BASE.replace(/\/+$/, "")}/api/partners/list`


export default function ApplyNowPage() {
  const router = useRouter()
  const heroRef = useRef<HTMLElement>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [partnersCount, setPartnersCount] = useState<number | null>(null)
  const [statsLoading, setStatsLoading] = useState<boolean>(true)

  
  // tone (SSR-safe)
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const tone = mounted && resolvedTheme === "light" ? "light" : "dark"

  function buildPayload(form: FormState) {
    const [country, city] = (form.country || "").split(",").map((s) => s.trim())

    return {
      companyName: form.companyName.trim(),
      companyType: form.companyType.trim(),
      website: form.website.trim() || undefined,
      contactName: form.contactName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      country: country || undefined,
      city: city || undefined,
      interests: form.interests,
      monthlyVolume: form.monthlyVolume === "" ? undefined : Number(form.monthlyVolume),
      notes: form.notes.trim() || undefined,
      agree: !!form.agree, // строго boolean
    }
  }

  // формируем body как x-www-form-urlencoded, чтобы избежать preflight
  function toForm(payload: ReturnType<typeof buildPayload>) {
    const s = new URLSearchParams()
    s.set("companyName", payload.companyName)
    s.set("companyType", payload.companyType)
    if (payload.website) s.set("website", payload.website)
    s.set("contactName", payload.contactName)
    s.set("email", payload.email)
    if (payload.phone) s.set("phone", payload.phone)
    if (payload.country) s.set("country", payload.country)
    if (payload.city) s.set("city", payload.city)
    if (payload.monthlyVolume != null) s.set("monthlyVolume", String(payload.monthlyVolume))
    if (payload.notes) s.set("notes", payload.notes)
    s.set("agree", String(!!payload.agree))
    // interests как объект-булевки — DTO сам приведёт к массиву
    Object.entries(payload.interests || {}).forEach(([k, v]) => {
      s.set(`interests[${k}]`, String(!!v))
    })
    return s
  }

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://saturnusgo-backend-production.up.railway.app"

  function apiUrl(path: string) {
    const base = API_BASE.replace(/\/+$/, "") + "/"
    return new URL(path.replace(/^\/+/, ""), base).toString()
  }

  async function submitApplication(payload: ReturnType<typeof buildPayload>) {
    const res = await fetch(apiUrl("/api/partners/list"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      credentials: "omit",
      cache: "no-store",
    })

    let data: any = null
    try {
      data = await res.json()
    } catch {}

    if (!res.ok || data?.success === false) {
      const msg = (Array.isArray(data?.message) ? data.message[0] : data?.message) || `HTTP ${res.status}`
      throw new Error(msg)
    }
    return data
  }

  // hero parallax
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY
          const heroHeight = hero.offsetHeight
          const progress = Math.min(scrollY / (heroHeight * 0.6), 1)
          hero.style.transform = `translateY(${progress * 15}px)`
          hero.style.opacity = `${Math.max(1 - progress * 0.2, 0.8)}`
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // load partners total quickly (page=1&limit=1 -> только метаданные total)
useEffect(() => {
  const abort = new AbortController()
  async function fetchTotals() {
    setStatsLoading(true)
    try {
      const url = `${PARTNER_LIST_ENDPOINT}?page=1&limit=1`
      const res = await fetch(url, { method: "GET", cache: "no-store", signal: abort.signal })
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      const json: ListResponse = await res.json()
      setPartnersCount(Math.max(0, Number(json?.total ?? 0)))
    } catch (e) {
      // не роняем страницу, просто покажем "—"
      setPartnersCount(null)
    } finally {
      setStatsLoading(false)
    }
  }
  fetchTotals()
  return () => abort.abort()
}, [])


  // Стейт пометь явно (не обязательно, но удобно)
  const [form, setForm] = useState<FormState>({
    companyName: "",
    companyType: "Hotel",
    website: "",
    contactName: "",
    email: "",
    phone: "",
    country: "",
    city: "",
    interests: { hotels: true, restaurants: false, cafes: false, events: false },
    monthlyVolume: "",
    notes: "",
    agree: false,
  })

  const onChange =
    (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((s) => ({ ...s, [key]: e.target.value }))
    }

  // 🔄 вместо чекбоксов — toggle по кнопке
  const toggleInterest = (key: keyof typeof form.interests) => {
    setForm((s) => ({ ...s, interests: { ...s.interests, [key]: !s.interests[key] } }))
  }

  const validate = () => {
    const next: Record<string, string> = {}
    if (!form.companyName.trim()) next.companyName = "Company name is required"
    if (!form.contactName.trim()) next.contactName = "Contact name is required"
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Valid email is required"
    if (!form.agree) next.agree = "You must accept the terms"
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setErrors({})
    try {
      const payload = buildPayload(form)
      await submitApplication(payload)
      setSuccess(true)
      setTimeout(() => router.push("/partners"), 1600)
    } catch (err: any) {
      // быстрый UX: подсветим общую ошибку у agree/почты, если это они
      const msg = String(err?.message || "Something went wrong")
      const next: Record<string, string> = {}
      if (/email/i.test(msg)) next.email = msg
      if (/accept|agree/i.test(msg)) next.agree = msg
      setErrors(Object.keys(next).length ? next : { general: msg })
    } finally {
      setSubmitting(false)
    }
  }

  const formatCompact = (n: number) =>
  new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n)


  return (
    <div className="apply-page" data-tone={tone}>
      <BackgroundEffects />

      {/* Hero */}
      <section ref={heroRef} className="hero-section">
        <div className="hero-content">
          <div className="hero-logo">
            <img
              src="https://wjfhdyynywkjudwlouxv.supabase.co/storage/v1/object/public/Video-host/logo.png"
              alt="SaturnusGo logo"
              className="hero-logo-img"
            />
          </div>

          <h1 className="hero-title">
            <span className="hero-title-main">Partner with</span>
            <span className="hero-company">SaturnusGo</span>
          </h1>

          <p className="hero-subtitle">
            Join the all-in-one travel super-app. Connect your brand to hotels, restaurants, cafés, events — one
            seamless experience.
          </p>

          <div className="hero-stats">
  <div className="stat-item" aria-live="polite">
    <span className="stat-number">
      {statsLoading ? "—" : partnersCount == null ? "—" : formatCompact(partnersCount)}
    </span>
    <span className="stat-label">Partners</span>
  </div>

  <div className="stat-divider" />

  <div className="stat-item">
    <span className="stat-number">{formatCompact(0)}</span>
    <span className="stat-label">Bookings</span>
  </div>

  <div className="stat-divider" />

  <div className="stat-item">
    <span className="stat-number">24h</span>
    <span className="stat-label">Response</span>
  </div>
</div>

        </div>
      </section>

      {/* Form */}
      <section className="form-section">
        <div className="section-container">
          <div className="form-header">
            <h2 className="form-title">Application Details</h2>
            <p className="form-subtitle">Tell us about your business and we'll get back to you within 24 hours</p>
          </div>

          <div className="form-card">
            {errors.general && (
              <div className="error-box" role="alert">
                {/^please try again/i.test(errors.general)
                  ? "Too many submissions from this email in the last 10 minutes. Please try again later or use a different email."
                  : errors.general}
              </div>
            )}

            {success ? (
              <div className="success-state">
                <CheckCircle className="success-icon" />
                <h3 className="success-title">Application sent</h3>
                <p className="success-subtitle">We'll get back to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="grid-form">
                <div className="form-section-group">
                  <h3 className="section-title">Company Information</h3>
                  <div className="grid-2">
                    <div className="field">
                      <label htmlFor="companyName">Company name</label>
                      <div className="input">
                        <Building2 />
                        <input
                          id="companyName"
                          placeholder="e.g., Hotel Aurora"
                          value={form.companyName}
                          onChange={onChange("companyName")}
                          aria-invalid={!!errors.companyName}
                          aria-describedby={errors.companyName ? "err-companyName" : undefined}
                        />
                      </div>
                      {errors.companyName && (
                        <p id="err-companyName" className="err">
                          {errors.companyName}
                        </p>
                      )}
                    </div>

                    <div className="field">
                      <label htmlFor="companyType">Business type</label>
                      <div className="select">
                        <select id="companyType" value={form.companyType} onChange={onChange("companyType")}>
                          <option>Hotel</option>
                          <option>Resort</option>
                          <option>Restaurant</option>
                          <option>Café</option>
                          <option>Event Venue</option>
                          <option>Experience Provider</option>
                          <option>Other Service</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid-2">
                    <div className="field">
                      <label htmlFor="website">Website</label>
                      <div className="input">
                        <Globe2 />
                        <input
                          id="website"
                          placeholder="https://..."
                          value={form.website}
                          onChange={onChange("website")}
                        />
                      </div>
                    </div>

                    <div className="field">
                      <label htmlFor="monthlyVolume">Monthly volume</label>
                      <div className="input">
                        <input
                          id="monthlyVolume"
                          placeholder="e.g., 450 rooms/bookings"
                          value={form.monthlyVolume}
                          onChange={onChange("monthlyVolume")}
                          inputMode="numeric"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-section-group">
                  <h3 className="section-title">Contact Details</h3>
                  <div className="grid-2">
                    <div className="field">
                      <label htmlFor="contactName">Contact name</label>
                      <div className="input">
                        <User />
                        <input
                          id="contactName"
                          placeholder="Full name"
                          value={form.contactName}
                          onChange={onChange("contactName")}
                          aria-invalid={!!errors.contactName}
                          aria-describedby={errors.contactName ? "err-contactName" : undefined}
                        />
                      </div>
                      {errors.contactName && (
                        <p id="err-contactName" className="err">
                          {errors.contactName}
                        </p>
                      )}
                    </div>

                    <div className="field">
                      <label htmlFor="email">Email</label>
                      <div className="input">
                        <Mail />
                        <input
                          id="email"
                          type="email"
                          placeholder="name@company.com"
                          value={form.email}
                          onChange={onChange("email")}
                          aria-invalid={!!errors.email}
                          aria-describedby={errors.email ? "err-email" : undefined}
                        />
                      </div>
                      {errors.email && (
                        <p id="err-email" className="err">
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid-2">
                    <div className="field">
                      <label htmlFor="phone">Phone</label>
                      <div className="input">
                        <Phone />
                        <input id="phone" placeholder="+54 11 ..." value={form.phone} onChange={onChange("phone")} />
                      </div>
                    </div>

                    <div className="field">
                      <label htmlFor="country">Country & city</label>
                      <div className="input">
                        <MapPin />
                        <input
                          id="country"
                          placeholder="Country, City"
                          value={form.country}
                          onChange={onChange("country")}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-section-group">
                  <h3 className="section-title">Partnership Interests</h3>
                  <div className="field">
                    <label>What would you like to integrate?</label>
                    <div className="chips chips--enhanced" role="group" aria-label="Integration interests">
                      <button
                        type="button"
                        className={`chip ${form.interests.hotels ? "chip-on" : ""}`}
                        aria-pressed={form.interests.hotels}
                        onClick={() => toggleInterest("hotels")}
                      >
                        🏨 Hotels
                      </button>

                      <button
                        type="button"
                        className={`chip ${form.interests.restaurants ? "chip-on" : ""}`}
                        aria-pressed={form.interests.restaurants}
                        onClick={() => toggleInterest("restaurants")}
                      >
                        🍽️ Restaurants
                      </button>

                      <button
                        type="button"
                        className={`chip ${form.interests.cafes ? "chip-on" : ""}`}
                        aria-pressed={form.interests.cafes}
                        onClick={() => toggleInterest("cafes")}
                      >
                        ☕ Cafés
                      </button>

                      <button
                        type="button"
                        className={`chip ${form.interests.events ? "chip-on" : ""}`}
                        aria-pressed={form.interests.events}
                        onClick={() => toggleInterest("events")}
                      >
                        🎉 Events
                      </button>
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="notes">Additional information</label>
                    <textarea
                      id="notes"
                      rows={4}
                      placeholder="Tell us about your current systems, goals, timelines, or any specific requirements..."
                      value={form.notes}
                      onChange={onChange("notes")}
                    />
                  </div>
                </div>

                <div className="form-footer">
                  <div className="agree">
                    <label className="agree-row">
                      <input
                        type="checkbox"
                        checked={form.agree}
                        onChange={(e) => setForm((s) => ({ ...s, agree: e.target.checked }))}
                      />
                      <span>I agree to be contacted about partnership opportunities and have read the terms.</span>
                    </label>
                    {errors.agree && <p className="err">{errors.agree}</p>}
                  </div>

                  <div className="actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => router.push("/partners")}
                      aria-label="Back to Partners"
                    >
                      Back
                    </button>
                    <button className="btn-primary" type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <div className="spinner" />
                          Sending...
                        </>
                      ) : (
                        <>
                          Submit application
                          <ArrowRight className="btn-icon" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* STYLES */}
      <style jsx global>{`
        /* ================================
           TOKENS — DARK (default)
        ==================================*/
        .apply-page {
          --bg-0: #0a0b0d;
          --bg-1: #0f1115;
          --bg-2: #1a1d23;
          --grid: rgba(255, 255, 255, 0.025);

          --txt: #f8fafc;
          --txt-2: #cbd5e1;
          --txt-3: #94a3b8;
          --txt-4: #64748b;

          --white-02: rgba(255, 255, 255, 0.02);
          --white-04: rgba(255, 255, 255, 0.04);
          --white-06: rgba(255, 255, 255, 0.06);
          --white-08: rgba(255, 255, 255, 0.08);
          --white-12: rgba(255, 255, 255, 0.12);
          --white-16: rgba(255, 255, 255, 0.16);

          --primary: #6366f1;
          --primary-hover: #5b5cf6;
          --primary-light: rgba(99, 102, 241, 0.1);

          --success: #10b981;
          --error: #ef4444;

          --radius-sm: 8px;
          --radius-md: 12px;
          --radius-lg: 16px;
          --radius-xl: 24px;
          --radius-2xl: 32px;

          --shadow-sm: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          --shadow-md: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          --shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          --shadow-xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

          min-height: 100vh;
          background: radial-gradient(ellipse at top, var(--bg-1) 0%, var(--bg-0) 50%, var(--bg-1) 100%);
          color: var(--txt);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          line-height: 1.6;
        }
        .hero-stats .stat-number { min-width: 3ch; display: inline-block; text-align: center; }

        /* ================================
           TOKENS — LIGHT OVERRIDES
        ==================================*/
        .apply-page[data-tone='light'],
        :global(html.light) .apply-page {
          --bg-0: #ffffff;
          --bg-1: #f8fafc;
          --bg-2: #f1f5f9;
          --grid: rgba(15, 23, 42, 0.04);

          --txt: #0f172a;
          --txt-2: #334155;
          --txt-3: #64748b;
          --txt-4: #94a3b8;

          --white-02: rgba(15, 23, 42, 0.02);
          --white-04: rgba(15, 23, 42, 0.04);
          --white-06: rgba(15, 23, 42, 0.06);
          --white-08: rgba(15, 23, 42, 0.08);
          --white-12: rgba(15, 23, 42, 0.12);
          --white-16: rgba(15, 23, 42, 0.16);

          --shadow-sm: 0 4px 6px -1px rgba(15, 23, 42, 0.05);
          --shadow-md: 0 10px 15px -3px rgba(15, 23, 42, 0.08);
          --shadow-lg: 0 20px 25px -5px rgba(15, 23, 42, 0.1);
          --shadow-xl: 0 25px 50px -12px rgba(15, 23, 42, 0.15);

          background: radial-gradient(ellipse at top, var(--bg-1) 0%, var(--bg-0) 50%, var(--bg-1) 100%);
        }

        /* ================================
           HERO SECTION
        ==================================*/
        .hero-section {
          position: relative;
          min-height: 75vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 120px 24px 80px;
          text-align: center;
        }
        
        .hero-content { 
          max-width: 900px; 
          width: 100%; 
        }
        
        .hero-logo-img {
          max-width: 140px;
          height: auto;
          margin: 0 auto 32px;
          display: block;
          filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.3));
          transition: transform 0.3s ease;
        }
        .hero-logo-img:hover {
          transform: scale(1.05);
        }
        
        .apply-page[data-tone='light'] .hero-logo-img,
        :global(html.light) .apply-page .hero-logo-img {
          filter: drop-shadow(0 16px 32px rgba(15, 23, 42, 0.1));
        }
        
        .hero-title {
          font-size: clamp(48px, 8vw, 84px);
          font-weight: 800;
          line-height: 1.05;
          margin-bottom: 24px;
          letter-spacing: -0.02em;
        }
        
        .hero-title-main {
          display: block;
          background: linear-gradient(135deg, var(--txt) 0%, var(--txt-2) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        
        .hero-company { 
          display: block; 
          background: linear-gradient(135deg, var(--primary) 0%, #8b5cf6 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          margin-top: 8px;
        }
        
        .hero-subtitle {
          font-size: 20px;
          line-height: 1.6;
          color: var(--txt-2);
          margin: 0 auto 48px;
          max-width: 720px;
          font-weight: 400;
        }

        .hero-stats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 32px;
          margin-top: 48px;
          flex-wrap: wrap;
        }
        
        .stat-item {
          text-align: center;
        }
        
        .stat-number {
          display: block;
          font-size: 28px;
          font-weight: 700;
          color: var(--primary);
          line-height: 1;
        }
        
        .stat-label {
          display: block;
          font-size: 14px;
          color: var(--txt-3);
          margin-top: 4px;
          font-weight: 500;
        }
        
        .stat-divider {
          width: 1px;
          height: 32px;
          background: var(--white-12);
        }

        /* ================================
           FORM SECTION
        ==================================*/
        .form-section { 
          padding: 40px 0 160px; 
          position: relative;
        }
        
        .section-container { 
          max-width: 1200px; 
          margin: 0 auto; 
          padding: 0 24px; 
        }

        .form-header {
          text-align: center;
          margin-bottom: 48px;
        }
        
        .form-title {
          font-size: 36px;
          font-weight: 700;
          margin: 0 0 12px;
          color: var(--txt);
          letter-spacing: -0.01em;
        }
        
        .form-subtitle {
          font-size: 18px;
          color: var(--txt-2);
          margin: 0;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .form-card {
          margin: 0 auto;
          padding: 48px;
          border: 1px solid var(--white-08);
          border-radius: var(--radius-2xl);
          background: var(--white-04);
          backdrop-filter: blur(20px);
          box-shadow: var(--shadow-xl);
          position: relative;
          overflow: hidden;
        }
        
        .form-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--white-16), transparent);
        }

        .grid-form { 
          display: grid; 
          gap: 40px; 
        }

        .form-section-group {
          padding: 32px 0;
          border-bottom: 1px solid var(--white-06);
        }
        
        .form-section-group:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        
        .section-title {
          font-size: 20px;
          font-weight: 600;
          color: var(--txt);
          margin: 0 0 24px;
          letter-spacing: -0.01em;
        }
        
        .grid-2 {
          display: grid; 
          gap: 24px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          margin-bottom: 24px;
        }
        .grid-2:last-child {
          margin-bottom: 0;
        }
        
        @media (max-width: 860px) { 
          .grid-2 { grid-template-columns: 1fr; }
          .form-card { padding: 32px 24px; }
          .hero-stats { gap: 24px; }
          .stat-divider { display: none; }
        }

        /* ================================
           FORM FIELDS
        ==================================*/
        .field { 
          margin-bottom: 24px; 
        }
        .field:last-child {
          margin-bottom: 0;
        }
        
        .field label {
          display: block;
          font-size: 15px;
          color: var(--txt-2);
          margin-bottom: 8px;
          font-weight: 600;
          letter-spacing: -0.01em;
        }
        
        .input, .select {
          display: flex; 
          align-items: center; 
          gap: 12px;
          background: var(--white-04);
          border: 1.5px solid var(--white-08);
          border-radius: var(--radius-lg);
          padding: 16px 18px;
          transition: all 0.2s ease;
          position: relative;
        }
        
        .input:focus-within, .select:focus-within {
          border-color: var(--primary);
          background: var(--white-06);
          box-shadow: 0 0 0 3px var(--primary-light);
        }
        
        .input svg { 
          width: 20px; 
          height: 20px; 
          color: var(--txt-3); 
          flex: 0 0 auto; 
        }
        
        .input input, .select select {
          background: transparent; 
          border: 0; 
          outline: 0;
          color: var(--txt); 
          width: 100%; 
          font-size: 16px;
          font-weight: 500;
        }
        
        .input input::placeholder {
          color: var(--txt-4);
        }
        
        .select select {
          appearance: none;
          cursor: pointer;
        }
        
        .select::after {
          content: '';
          width: 12px;
          height: 12px;
          border: 2px solid var(--txt-3);
          border-top: none;
          border-left: none;
          transform: rotate(45deg);
          margin-top: -2px;
          pointer-events: none;
        }
        
        textarea {
          width: 100%;
          background: var(--white-04);
          border: 1.5px solid var(--white-08);
          border-radius: var(--radius-lg);
          color: var(--txt);
          padding: 16px 18px;
          font-size: 16px;
          font-weight: 500;
          resize: vertical;
          min-height: 120px;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        
        textarea:focus {
          outline: none;
          border-color: var(--primary);
          background: var(--white-06);
          box-shadow: 0 0 0 3px var(--primary-light);
        }
        
        textarea::placeholder {
          color: var(--txt-4);
        }

        /* ================================
           CHIPS
        ==================================*/
        .chips {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        .chips--enhanced {
          gap: 16px;
        }
        
        .chip {
          padding: 12px 20px;
          border-radius: 999px;
          border: 1.5px solid var(--white-12);
          background: var(--white-04);
          color: var(--txt-2);
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          user-select: none;
          white-space: nowrap;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        
        .chip::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, var(--white-08), transparent);
          transition: left 0.5s ease;
        }
        
        .chip:hover::before {
          left: 100%;
        }
        
        .chip:hover {
          border-color: var(--primary);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        
        .chip:active { 
          transform: translateY(0); 
        }
        
        .chip[aria-pressed="true"],
        .chip.chip-on {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
          box-shadow: var(--shadow-md);
        }
        
        .chip.chip-on::before {
          display: none;
        }

        /* ================================
           FORM FOOTER
        ==================================*/
        .form-footer {
          padding-top: 32px;
          border-top: 1px solid var(--white-06);
        }
        
        .agree { 
          margin-bottom: 32px; 
        }
        
        .agree-row { 
          display: flex; 
          align-items: flex-start; 
          gap: 12px; 
          color: var(--txt-2); 
          font-size: 15px; 
          user-select: none;
          line-height: 1.5;
        }
        
        .agree-row input { 
          width: 20px; 
          height: 20px; 
          accent-color: var(--primary);
          margin-top: 2px;
          flex-shrink: 0;
        }

        /* ================================
           BUTTONS
        ==================================*/
        .actions { 
          display: flex; 
          gap: 16px; 
          justify-content: flex-end; 
          align-items: center;
        }
        
        .btn-primary, .btn-secondary {
          display: inline-flex; 
          align-items: center; 
          gap: 10px;
          padding: 16px 28px; 
          border-radius: var(--radius-lg);
          font-weight: 600; 
          font-size: 16px; 
          cursor: pointer; 
          border: none; 
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        
        .btn-primary { 
          background: var(--primary); 
          color: white;
          box-shadow: var(--shadow-md);
        }
        
        .btn-primary:hover:not(:disabled) { 
          background: var(--primary-hover); 
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }
        
        .btn-primary:active:not(:disabled) {
          transform: translateY(0);
        }
        
        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .btn-secondary { 
          background: var(--white-04); 
          color: var(--txt); 
          border: 1.5px solid var(--white-12); 
        }
        
        .btn-secondary:hover { 
          background: var(--white-08); 
          border-color: var(--white-16);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        
        .btn-icon { 
          width: 18px; 
          height: 18px; 
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* ================================
           VALIDATION & SUCCESS
        ==================================*/
        .err { 
          color: var(--error); 
          font-size: 13px; 
          margin-top: 8px;
          font-weight: 500;
        }

        .error-box {
          padding: 16px 20px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: var(--radius-lg);
          color: var(--error);
          margin-bottom: 32px;
          font-weight: 500;
        }

        .success-state { 
          text-align: center; 
          padding: 60px 24px; 
        }
        
        .success-icon { 
          width: 64px; 
          height: 64px; 
          color: var(--success); 
          margin: 0 auto 16px; 
        }
        
        .success-title { 
          font-size: 24px; 
          font-weight: 700; 
          margin: 0 0 8px;
          color: var(--txt);
        }
        
        .success-subtitle { 
          color: var(--txt-2); 
          margin: 0;
          font-size: 16px;
        }

        /* ================================
           RESPONSIVE & ACCESSIBILITY
        ==================================*/
        @media (max-width: 640px) {
          .actions {
            flex-direction: column-reverse;
            align-items: stretch;
          }
          
          .btn-primary, .btn-secondary {
            justify-content: center;
          }
          
          .hero-title {
            font-size: clamp(36px, 10vw, 48px);
          }
          
          .form-title {
            font-size: 28px;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .hero-section { transform: none !important; opacity: 1 !important; }
          .chip::before { display: none; }
          * { animation-duration: 0.01ms !important; }
        }

        /* Focus styles for accessibility */
        .chip:focus-visible {
          outline: 2px solid var(--primary);
          outline-offset: 2px;
        }
        
        .btn-primary:focus-visible,
        .btn-secondary:focus-visible {
          outline: 2px solid var(--primary);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  )
}
