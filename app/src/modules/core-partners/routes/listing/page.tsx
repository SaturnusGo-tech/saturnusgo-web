// app/partners/listing/page.tsx
"use client"

import { useRef, useEffect, useState } from "react"
import { useTheme } from "next-themes"
import Link from "next/link"
// 1) ДОБАВЬ к существующему импорту lucide-react:
import {
    ArrowRight, Search, Filter, MapPin, Building2,
    BedDouble, UtensilsCrossed, Coffee, Sun, Ticket, Mountain, Briefcase
  } from "lucide-react"
  

// 2) ДОБАВЬ компонент TypeIcon (выше export default или рядом с BackgroundEffects):

const TypeIcon = ({ type }: { type?: string }) => {
    // Нормализуем вход
    const t = (type || "").trim().toLowerCase()
  
    // Карта соответствий companyType → иконка
    // Поддерживаем значения после sanitizeCompanyType на бэке:
    // 'Hotel','Resort','Restaurant','Café','Event Venue','Experience Provider','Other Service'
    if (t === "hotel")           return <BedDouble className="logo-icon-svg" aria-label="Hotel" />
    if (t === "resort")          return <Sun className="logo-icon-svg" aria-label="Resort" />
    if (t === "restaurant")      return <UtensilsCrossed className="logo-icon-svg" aria-label="Restaurant" />
    if (t === "café" || t === "cafe") return <Coffee className="logo-icon-svg" aria-label="Café" />
    if (t === "event venue")     return <Ticket className="logo-icon-svg" aria-label="Event Venue" />
    if (t === "experience provider") return <Mountain className="logo-icon-svg" aria-label="Experience Provider" />
    if (t === "other service")   return <Briefcase className="logo-icon-svg" aria-label="Other Service" />
  
    // Fallback — нейтральное здание
    return <Building2 className="logo-icon-svg" aria-label="Partner" />
  }

  
type Partner = {
  id: string
  name: string
  type?: string
  location?: string
  description?: string
  logo?: string
  status?: "new" | "in_review" | "approved" | "rejected"
}

type PartnerApplication = {
  id: number
  companyName: string
  companyType: string
  website?: string | null
  contactName: string
  email: string
  phone?: string | null
  country?: string | null
  city?: string | null
  interests: Array<"hotels" | "restaurants" | "cafes" | "events">
  monthlyVolume?: number | null
  notes?: string | null
  agree: boolean
  status: "new" | "in_review" | "approved" | "rejected"
  createdAt: string
  updatedAt: string
}

type ListResponse = {
  success: boolean
  page: number
  limit: number
  total: number
  data: PartnerApplication[]
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://saturnusgo-backend-production.up.railway.app"
const PARTNER_LIST_ENDPOINT = `${API_BASE}/api/partners/list`

const BackgroundEffects = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div
      className="absolute inset-0 opacity-[0.015]"
      style={{
        backgroundImage: `
          linear-gradient(var(--grid) 1px, transparent 1px),
          linear-gradient(90deg, var(--grid) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      }}
    />
  </div>
)

const typeOptions = [
  { value: "all", label: "All types" },
  { value: "Hotel", label: "Hotels" },
  { value: "Resort", label: "Resorts" },
  { value: "Event Venue", label: "Event venues" },
  { value: "Restaurant", label: "Restaurants" },
  { value: "Café", label: "Cafés" },
  { value: "Experience Provider", label: "Experience providers" },
  { value: "Other Service", label: "Other services" },
]

function authHeaders(): HeadersInit {
  // опционально: если эндпоинт под AuthGuard — прикрепляем Bearer-токен, если он есть
  try {
    const token =
      (typeof window !== "undefined" && (localStorage.getItem("saturnusgo_token") || localStorage.getItem("token") || localStorage.getItem("access_token"))) ||
      ""
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

function mapPartner(a: PartnerApplication): Partner {
  return {
    id: String(a.id),
    name: a.companyName,
    type: a.companyType,
    location: [a.city, a.country].filter(Boolean).join(", "),
    description: a.notes ?? undefined,
    logo: undefined, // бэкенд пока не отдаёт логотипы
    status: a.status,
  }
}

export default function PartnerListingPage() {
  const heroRef = useRef<HTMLElement>(null)

  // tone (dark/light)
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const tone = mounted && resolvedTheme === "light" ? "light" : "dark"

  // simple parallax for hero
  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const y = window.scrollY
          const h = el.offsetHeight || 1
          const p = Math.min(y / (h * 0.6), 1)
          el.style.transform = `translateY(${p * 15}px)`
          el.style.opacity = `${Math.max(1 - p * 0.2, 0.8)}`
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // DATA
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // filters
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([])

  // fetch ALL partners from all statuses (pagination-aware)
  useEffect(() => {
    const abort = new AbortController()
    const headers: HeadersInit = {}

    async function fetchAll() {
      setLoading(true)
      setError(null)
      const limit = 200 // max allowed by DTO
      let page = 1
      let acc: Partner[] = []

      try {
        for (;;) {
          const url = `${PARTNER_LIST_ENDPOINT}?page=${page}&limit=${limit}`
          const res = await fetch(url, {
            method: "GET",
            headers,
            
            cache: "no-store",
            signal: abort.signal,
          })

          if (!res.ok) {
            // читаем текст ошибки для дебага
            const msg = `${res.status} ${res.statusText}`
            throw new Error(msg)
          }

          const json: ListResponse = await res.json()
          const batch = (json.data || []).map(mapPartner)
          acc = acc.concat(batch)

          if (acc.length >= json.total || batch.length === 0) break
          page += 1
        }

        setPartners(acc)
      } catch (e: any) {
        if (e?.name !== "AbortError") {
            setError("Failed to load partners. " + (e?.message || "Unknown error"))
        }
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
    return () => abort.abort()
  }, [])

  // apply filters
  useEffect(() => {
    let filtered = partners

    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      filtered = filtered.filter((p) =>
        [p.name, p.location, p.type].some((v) => v?.toLowerCase().includes(q)),
      )
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((p) => p.type === typeFilter)
    }

    setFilteredPartners(filtered)
  }, [partners, searchTerm, typeFilter])

  return (
    <div className="partner-listing" data-tone={tone}>
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
            Our <span className="hero-company">Partners</span>
          </h1>

          <p className="hero-subtitle">
            Browse the partner directory once integrations are live. This page shows real partners only
          </p>
        </div>
      </section>

      {/* Error/Loading */}
      <section className="section-container" style={{ paddingTop: 8 }}>
        {loading && (
          <div className="loading-bar" role="status" aria-live="polite">
            Loading partners…
          </div>
        )}
        {error && (
          <div className="error-box" role="alert">
            {error}
          </div>
        )}
      </section>

      {/* Filters */}
      <section className="filters-section">
        <div className="section-container">
          <div className="filters-header">
            <h2 className="filters-title">Search & filters</h2>
            <p className="filters-subtitle">Find partners by name, location, or business type.</p>
          </div>

          <div className="filters-grid">
            <div className="search-box">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search by name, city, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filter-group">
              <Building2 className="filter-icon" />
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="filter-select">
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <Filter className="filter-icon" />
              <select className="filter-select" disabled>
                <option>More filters soon</option>
              </select>
            </div>
          </div>

          <div className="results-count">
            Found: <span className="count-number">{filteredPartners.length}</span>
          </div>
        </div>
      </section>

      {/* Partners Grid */}
      <section className="partners-section">
        <div className="section-container">
          <div className="partners-grid">
            {filteredPartners.map((partner) => (
              <div key={partner.id} className="partner-card">
                <div className="partner-header">
<div className="partner-logo">
  {partner.logo
    ? <img src={partner.logo} alt={`${partner.name} logo`} className="logo-img" />
    : <TypeIcon type={partner.type} />
  }
</div>

                  {partner.status && (
                    <span className={`status-pill status-${partner.status}`}>
                      {partner.status === "new" && "New"}
                      {partner.status === "in_review" && "In review"}
                      {partner.status === "approved" && "Approved"}
                      {partner.status === "rejected" && "Rejected"}
                    </span>
                  )}
                </div>

                <div className="partner-info">
                  <h3 className="partner-name">{partner.name}</h3>
                  {partner.type && <div className="partner-type">{partner.type}</div>}
                  {partner.description && <p className="partner-description">{partner.description}</p>}
                </div>

                <div className="partner-details">
                  {partner.location && (
                    <div className="detail-item">
                      <MapPin className="detail-icon" />
                      <span>{partner.location}</span>
                    </div>
                  )}
                </div>

                <div className="partner-actions">
                  <Link className="btn-secondary" href="/partners">
                    Learn more
                    <ArrowRight className="btn-icon" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {!loading && !error && filteredPartners.length === 0 && (
            <div className="no-results">
              <div className="no-results-icon">
                <Search />
              </div>
              <h3 className="no-results-title">No partners to display</h3>
              <p className="no-results-text">
                Once integrations are in place, verified partners will appear here.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="section-container">
          <div className="cta-content">
            <h2 className="cta-title">Want to become a partner?</h2>
            <p className="cta-subtitle">
              Join SaturnusGo as we build a unified travel ecosystem. Submit your application to start the review
              process.
            </p>
            <Link href="/partners/apply" className="btn-primary">
              Apply now
              <ArrowRight className="btn-icon" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">
            <img
              src="https://wjfhdyynywkjudwlouxv.supabase.co/storage/v1/object/public/Video-host/logo.png"
              alt="SaturnusGo logo"
              className="footer-logo-img"
            />
          </div>

          <div className="footer-links">

          <div className="link-group footer-cta-group">
    <h4 className="link-title">More</h4>
    <Link href="/investors" className="footer-cta">For Investors</Link>
    <Link href="/founder" className="footer-cta">About Founder</Link>
    <Link href="/lending" className="footer-cta">Lending</Link>
  </div>
            <div className="link-group">
              <h4 className="link-title">Company</h4>
              <Link href="/partners/about" className="footer-link">About Us</Link>
              <a href="/partners/careers" className="footer-link">Careers</a>
              <a href="/partners/contacts" className="footer-link">Contact</a>
              <a href="/partners/news" className="footer-link">News</a>
            </div>

            <div className="link-group">
              <h4 className="link-title">Partners</h4>
              <a href="#" className="footer-link">Partner Program</a>
              <a href="#" className="footer-link">Partner Portal</a>
              <a href="#" className="footer-link">Resources</a>
              <a href="#" className="footer-link">Support</a>
            </div>

            <div className="link-group">
              <h4 className="link-title">Legal</h4>
              <Link href="/partners/privacy" className="footer-link">Privacy Policy</Link>
              <Link href="/partners/terms" className="footer-link">Terms of Service</Link>
              <Link href="/partners/cookies" className="footer-link">Cookie Policy</Link>
              <Link href="/partners/compliance" className="footer-link">Compliance</Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>Copyright 2025 SaturnusGo. All rights reserved.</p>
        </div>
      </footer>
      {/* Styles */}
      <style jsx global>{`
        /* ============================
           TOKENS — DARK (default)
        =============================*/
        .partner-listing {
          --bg-0: #0a0b0d;
          --bg-1: #0f1115;
          --grid: rgba(255, 255, 255, 0.035);

          --txt: #e7e9ee;
          --txt-2: #c2c6cf;
          --txt-3: #9aa0a6;

          --white-02: rgba(255, 255, 255, 0.02);
          --white-08: rgba(255, 255, 255, 0.08);
          --white-12: rgba(255, 255, 255, 0.12);

          --primary: #646cff;
          --primary-hover: #5a63f0;

          --radius-md: 14px;
          --radius-lg: 20px;
          --radius-xl: 28px;

          --shadow-1: 0 10px 30px rgba(0, 0, 0, 0.28), 0 1px 0 rgba(255, 255, 255, 0.02) inset;
          --shadow-2: 0 24px 60px -20px rgba(0, 0, 0, 0.5);

          position: relative;
          width: 100%;
          min-height: 100vh;
          background:
            radial-gradient(1100px 560px at 50% -10%, rgba(100,108,255,.08), transparent),
            linear-gradient(135deg, var(--bg-0) 0%, var(--bg-1) 55%, var(--bg-0) 100%);
          color: var(--txt);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        /* === Footer: spacing & logo centering — final overrides === */
.partner-listing {
  /* больше отступа от верхней линии футера до заголовков разделов */
  --footer-pad-top: clamp(64px, 6vw, 96px);
  /* немного больше отступ снизу футера */
  --footer-pad-bottom: clamp(28px, 4vw, 48px);
  /* опускаем нижний ограничитель (линия в .footer-bottom) */
  --footer-line-gap: clamp(24px, 3vw, 36px);
}

/* применяем обновлённые переменные */
.footer {
  padding-top: var(--footer-pad-top) !important;
  padding-bottom: var(--footer-pad-bottom) !important;
}

/* лёгкий зазор перед сеткой ссылок, чтобы заголовки не «липли» к верхней границе */
.footer-links {
  margin-top: clamp(8px, 1.6vw, 14px) !important;
}

/* нижний ограничитель: чуть позже по вертикали и больше внутренний отступ сверху */
.footer-bottom {
  margin-top: var(--footer-line-gap) !important;
  padding-top: clamp(20px, 2.4vw, 28px) !important;
}

/* логотип — к визуальному центру своей колонки */
.footer-logo {
  align-self: center;                 /* центр по вертикали внутри grid-строки */
  display: flex;
  align-items: center;                /* центрируем сам img по оси контейнера */
  min-height: 100%;                   /* тянем колонку для ровного центрирования */
}

/* чуть крупнее можно оставить текущий размер; при необходимости — подстройка */
.footer-logo-img {
  max-width: 100px;                   /* ваш исходный размер */
  /* при желании — мягкая оптика: небольшое смещение вниз
     раскомментировать при необходимости
  transform: translateY(4px);
  */
}

/* мобильные — сохраняем баланс отступов */
@media (max-width: 768px) {
  .partner-listing {
    --footer-pad-top: clamp(40px, 7vw, 56px);
    --footer-pad-bottom: clamp(16px, 5vw, 28px);
    --footer-line-gap: clamp(18px, 5vw, 26px);
  }
  .footer-logo { align-self: center; }
  .footer-bottom { text-align: center; justify-content: center; }
}


        /* ============================
           TOKENS — LIGHT OVERRIDES
        =============================*/
        .partner-listing[data-tone='light'],
        :global(html.light) .partner-listing {
          --bg-0: #f6f8fb;
          --bg-1: #ffffff;
          --grid: rgba(2, 6, 23, 0.06);

          --txt: #0f172a;   /* slate-900 */
          --txt-2: #475569; /* slate-600 */
          --txt-3: #64748b; /* slate-500 */

          --white-02: rgba(2, 6, 23, 0.02);
          --white-08: rgba(2, 6, 23, 0.06);
          --white-12: rgba(2, 6, 23, 0.12);

          background:
            radial-gradient(1100px 560px at 50% -10%, rgba(100,108,255,.09), transparent),
            linear-gradient(135deg, var(--bg-0) 0%, var(--bg-1) 55%, var(--bg-0) 100%);
          color: var(--txt);
        }

        /* HERO */
        .hero-section {
          position: relative;
          min-height: 72vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 92px 24px 56px;
          text-align: center;
        }
        .hero-content { max-width: 900px; width: 100%; }
        .hero-logo { margin-bottom: 36px; }
        .hero-logo-img {
          max-width: 120px;
          height: auto;
          margin: 0 auto 18px;
          display: block;
          filter: drop-shadow(0 10px 20px rgba(0,0,0,.35));
        }
        .partner-listing[data-tone='light'] .hero-logo-img,
        :global(html.light) .partner-listing .hero-logo-img {
          filter: drop-shadow(0 8px 16px rgba(2,6,23,.12));
        }
        .hero-title {
          font-size: clamp(44px, 7vw, 84px);
          font-weight: 850;
          letter-spacing: -0.02em;
          line-height: 1.06;
          margin: 0 0 10px;
          background: linear-gradient(to right, var(--txt), var(--txt-2));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .hero-company { display: inline; color: var(--primary); }
        .hero-subtitle {
          font-size: 20px;
          line-height: 1.7;
          color: var(--txt-2);
          max-width: 760px;
          margin: 0 auto 0;
        }

        /* Feedback */
        .loading-bar {
          width: 100%;
          padding: 12px 16px;
          background: var(--white-08);
          border: 1px solid var(--white-12);
          border-radius: var(--radius-lg);
          color: var(--txt-2);
          text-align: center;
          margin-bottom: 16px;
        }
        .error-box {
          width: 100%;
          padding: 14px 16px;
          background: rgba(255, 59, 48, 0.08);
          border: 1px solid rgba(255, 59, 48, 0.22);
          border-radius: var(--radius-lg);
          color: #ff6b6b;
          font-weight: 600;
          margin-bottom: 16px;
        }

        /* Filters */
        .filters-section { padding: 80px 0; background: var(--white-02); }
        .section-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
        .filters-header { text-align: center; margin-bottom: 48px; }
        .filters-title {
          font-size: clamp(28px, 4vw, 36px);
          font-weight: 800;
          margin: 0 0 10px;
          background: linear-gradient(to right, var(--txt), var(--txt-2));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .filters-subtitle { color: var(--txt-2); font-size: 16px; max-width: 600px; margin: 0 auto; }

        .filters-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }
        @media (max-width: 768px) {
          .filters-grid { grid-template-columns: 1fr; }
        }

        .search-box { position: relative; display: flex; align-items: center; }
        .search-icon {
          position: absolute; left: 16px; width: 20px; height: 20px; color: var(--txt-3); z-index: 1;
        }
        .search-input {
          width: 100%;
          padding: 16px 16px 16px 48px;
          background: var(--white-08);
          border: 1px solid var(--white-12);
          border-radius: var(--radius-lg);
          color: var(--txt);
          font-size: 16px;
          transition: all 0.2s ease;
        }
        .search-input::placeholder { color: var(--txt-3); }
        .search-input:focus { outline: none; border-color: var(--primary); background: var(--white-12); }

        .filter-group { position: relative; display: flex; align-items: center; }
        .filter-icon {
          position: absolute; left: 16px; width: 18px; height: 18px; color: var(--txt-3); z-index: 1;
        }
        .filter-select {
          width: 100%;
          padding: 16px 16px 16px 48px;
          background: var(--white-08);
          border: 1px solid var(--white-12);
          border-radius: var(--radius-lg);
          color: var(--txt);
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          appearance: none;
        }
        .filter-select:focus { outline: none; border-color: var(--primary); background: var(--white-12); }

        .results-count { text-align: center; font-size: 16px; color: var(--txt-2); }
        .count-number { font-weight: 700; color: var(--primary); }

        /* Partners Grid */
        .partners-section { padding: 80px 0; }
        .partners-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 32px;
        }
        @media (max-width: 768px) {
          .partners-grid { grid-template-columns: 1fr; }
        }
        .logo-icon-svg {
            width: 40px;
            height: 40px;
            stroke-width: 1.75;
            color: var(--primary);
            /* Чуть подсветим фон контейнера под иконку */
            filter: drop-shadow(0 1px 0 rgba(0,0,0,.08));
          }
          .partner-listing[data-tone='light'] .logo-icon-svg {
            color: var(--primary);
            filter: drop-shadow(0 1px 0 rgba(2,6,23,.05));
          }
        .partner-card {
          background: var(--white-08);
          border: 1px solid var(--white-12);
          border-radius: var(--radius-xl);
          padding: 32px;
          transition: all 0.3s ease;
        }
        .partner-card:hover { transform: translateY(-6px); box-shadow: var(--shadow-2); background: var(--white-12); }

        .partner-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .partner-logo {
          width: 80px; height: 80px; background: var(--white-12); border-radius: var(--radius-lg);
          display: flex; align-items: center; justify-content: center; overflow: hidden;
        }
        .logo-img { max-width: 60px; max-height: 60px; object-fit: contain; }

        .status-pill {
          display: inline-flex;
          align-items: center;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 700;
          border-radius: 999px;
          border: 1px solid var(--white-12);
          background: var(--white-08);
          color: var(--txt-2);
          text-transform: uppercase;
          letter-spacing: .6px;
        }
        .status-approved { color: #00d17a; border-color: rgba(0,209,122,.25); background: rgba(0,209,122,.08); }
        .status-in_review { color: #f2b700; border-color: rgba(242,183,0,.28); background: rgba(242,183,0,.08); }
        .status-new { color: #5a63f0; border-color: rgba(90,99,240,.28); background: rgba(90,99,240,.08); }
        .status-rejected { color: #ff6b6b; border-color: rgba(255,107,107,.28); background: rgba(255,107,107,.08); }

        .partner-info { margin-bottom: 16px; }
        .partner-name { font-size: 22px; font-weight: 800; color: var(--txt); margin: 0 0 6px; }
        .partner-type {
          font-size: 13px; color: var(--primary); font-weight: 800; text-transform: uppercase; letter-spacing: .9px; margin-bottom: 10px;
        }
        .partner-description { font-size: 16px; line-height: 1.6; color: var(--txt-2); }

        .partner-details { margin-bottom: 18px; }
        .detail-item { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 14px; color: var(--txt-2); }
        .detail-icon { width: 16px; height: 16px; color: var(--txt-3); flex: 0 0 auto; }

        .partner-actions { display: flex; gap: 12px; }
        .btn-primary, .btn-secondary {
          display: inline-flex; align-items: center; gap: 8px; padding: 14px 24px;
          border-radius: var(--radius-lg); font-weight: 700; font-size: 14px; text-decoration: none;
          transition: all 0.2s ease; cursor: pointer; border: none; justify-content: center;
        }
        .btn-primary { background: var(--primary); color: #fff; }
        .btn-primary:hover { background: var(--primary-hover); transform: translateY(-2px); }
        .btn-secondary { background: var(--white-08); color: var(--txt); border: 1px solid var(--white-12); }
        .btn-secondary:hover { background: var(--white-12); transform: translateY(-2px); }
        .btn-icon { width: 16px; height: 16px; }

        /* Empty state */
        .no-results { text-align: center; padding: 80px 24px; }
        .no-results-icon {
          width: 80px; height: 80px; margin: 0 auto 20px; display: grid; place-items: center;
          background: var(--white-08); border: 1px solid var(--white-12); border-radius: var(--radius-xl); color: var(--txt-3);
        }
        .no-results-icon svg { width: 40px; height: 40px; }
        .no-results-title { font-size: 24px; font-weight: 800; color: var(--txt); margin: 0 0 8px; }
        .no-results-text { font-size: 16px; color: var(--txt-2); margin: 0; }

        /* CTA */
        .cta-section { padding: 120px 0; background: var(--white-02); }
        .cta-content { text-align: center; max-width: 640px; margin: 0 auto; }
        .cta-title {
          font-size: clamp(32px, 5vw, 48px);
          font-weight: 800;
          margin: 0 0 10px;
          background: linear-gradient(to right, var(--txt), var(--txt-2));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .cta-subtitle { font-size: 18px; line-height: 1.6; color: var(--txt-2); margin: 0 0 22px; }

        /* Footer */
        .footer { padding: 80px 0 40px; background: var(--white-02); border-top: 1px solid var(--white-12); }
        .footer-content {
          max-width: 1200px; margin: 0 auto; padding: 0 24px;
          display: grid; grid-template-columns: 1fr 2fr; gap: 64px; align-items: start;
        }
        @media (max-width: 768px) {
          .footer-content { grid-template-columns: 1fr; gap: 40px; text-align: center; }
        }
        .footer-logo-img { max-width: 100px; height: auto; }
        .footer-links { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 40px; }
        .link-group { display: flex; flex-direction: column; gap: 12px; }
        .link-title { font-size: 16px; font-weight: 700; color: var(--txt); margin: 0 0 4px; }
        .footer-link { color: var(--txt-2); text-decoration: none; font-size: 14px; transition: color .2s ease; }
        .footer-link:hover { color: var(--primary); }
        .footer-bottom { max-width: 1200px; margin: 0 auto; padding: 40px 24px 0; border-top: 1px solid var(--white-12); text-align: center; }
        .footer-bottom p { color: var(--txt-3); font-size: 14px; margin: 0; }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce){
          .hero-section { transform:none !important; opacity:1 !important; }
        }
        .footer { padding: 80px 0 40px; background: var(--white-02); border-top: 1px solid var(--white-12); }
        .footer-content {
          max-width: 1200px; margin: 0 auto; padding: 0 24px; display: grid;
          grid-template-columns: 1fr 2fr; gap: 64px; align-items: start;
        }
        .footer-links { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 40px; }
        .link-group { display: flex; flex-direction: column; gap: 12px; }
        .link-title { font-size: 16px; font-weight: 700; color: var(--txt); margin-bottom: 8px; }
        .footer-link { color: var(--txt-2); text-decoration: none; font-size: 14px; transition: color 0.2s ease; }
        .footer-link:hover { color: var(--primary); }
        .footer-logo-img { max-width: 100px; height: auto; }

        .footer-bottom {
          max-width: 1200px; margin: 0 auto; padding: 40px 24px 0; border-top: 1px solid var(--white-12); text-align: center;
        }
        .footer-bottom p { color: var(--txt-3); font-size: 14px; margin: 0; }

        /* ===== Footer — layout fix ===== */
.partner-program {
  --footer-pad-top: clamp(36px, 5vw, 56px);
  --footer-pad-bottom: clamp(14px, 2.2vw, 24px);
  --footer-gap: clamp(28px, 3vw, 48px);
  --footer-line-gap: clamp(18px, 2.2vw, 26px);
}

/* компактнее поля секции футера */
.footer {
  padding: var(--footer-pad-top) 0 var(--footer-pad-bottom) !important;
}

/* меньше межколоночный и межблочный зазор */
.footer-content {
  gap: var(--footer-gap) !important;
  align-items: start;
}

/* отодвигаем блок ссылок от разделительной линии снизу */
.footer-links {
  gap: clamp(28px, 3vw, 40px) !important;
  margin-bottom: var(--footer-line-gap) !important;
}

/* разделительная линия + копирайт справа внизу */
.footer-bottom {
  max-width: 1200px;
  margin: 0 auto;
  border-top: 1px solid var(--white-12);
  padding: 14px 24px calc(8px + env(safe-area-inset-bottom)) !important;
  display: flex;
  justify-content: flex-end;     /* вправо */
  align-items: center;
  text-align: right;
}

/* сам текст копирайта */
.footer-bottom p {
  margin: 0;
  color: var(--txt-3);
  font-size: 14px;
}

/* логотип в футере чуть компактнее, чтобы не раздувал высоту */
.footer-logo-img { max-width: 88px; }

/* Мобильная адаптация: копирайт по центру, мягче поля */
@media (max-width: 768px) {
  .footer {
    padding: clamp(28px, 6vw, 40px) 0 clamp(10px, 4vw, 18px) !important;
  }
  .footer-bottom {
    justify-content: center;
    text-align: center;
  }
}

      `}</style>
    </div>
  )
}
