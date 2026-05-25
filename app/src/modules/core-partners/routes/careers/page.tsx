// app/careers/page.tsx
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useTheme } from "next-themes"
import {
  Code2,
  Bug,
  BarChart3,
  Users2,
  Headset,
  Megaphone,
  Paintbrush,
  MapPin,
  Clock,
  ArrowRight,
  Info,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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

type Department =
  | "Engineering"
  | "QA"
  | "Analytics"
  | "Operations"
  | "Support"
  | "Marketing"
  | "Design"

type Job = {
  id: string
  title: string
  dept: Department
  location: string
  type: "Full-time" | "Part-time" | "Contract"
  salaryMin: number
  salaryMax: number
  summary: string
  tags: string[]
  status: "upcoming" | "open"
}

const LOGO =
  "https://wjfhdyynywkjudwlouxv.supabase.co/storage/v1/object/public/Video-host/logo.png"

const JOBS: Job[] = [
  {
    id: "fe-01",
    title: "Frontend Engineer",
    dept: "Engineering",
    location: "Remote / Buenos Aires",
    type: "Full-time",
    salaryMin: 0,
    salaryMax: 0,
    summary: "Next.js + TypeScript, polished UI, performance, animations.",
    tags: ["Next.js", "TypeScript", "Motion", "Design systems"],
    status: "upcoming",
  },
  {
    id: "be-01",
    title: "Backend Engineer",
    dept: "Engineering",
    location: "Remote / Buenos Aires",
    type: "Full-time",
    salaryMin: 0,
    salaryMax: 0,
    summary: "API design, payments, bookings, scalability, data flows.",
    tags: ["Node", "Postgres", "REST/GraphQL", "Payments"],
    status: "upcoming",
  },
  {
    id: "qa-01",
    title: "QA Engineer",
    dept: "QA",
    location: "Remote",
    type: "Full-time",
    salaryMin: 0,
    salaryMax: 0,
    summary: "E2E + regression, test cases, release quality.",
    tags: ["Playwright", "TestRail", "E2E", "Bug triage"],
    status: "upcoming",
  },
  {
    id: "an-01",
    title: "Product/Data Analyst",
    dept: "Analytics",
    location: "Remote",
    type: "Full-time",
    salaryMin: 0,
    salaryMax: 0,
    summary: "Metrics, funnels, dashboards, product insights.",
    tags: ["SQL", "Amplitude/GA4", "Dashboards"],
    status: "upcoming",
  },
  {
    id: "ops-01",
    title: "COO / Operations Director",
    dept: "Operations",
    location: "Buenos Aires / Remote",
    type: "Full-time",
    salaryMin: 0,
    salaryMax: 0,
    summary: "Operations, processes, partners, SLAs, scaling.",
    tags: ["Ops", "Playbooks", "SLA", "Partners"],
    status: "upcoming",
  },
  {
    id: "sup-01",
    title: "Support Specialist",
    dept: "Support",
    location: "Remote",
    type: "Full-time",
    salaryMin: 0,
    salaryMax: 0,
    summary: "First-line support, case triage, customer care.",
    tags: ["Helpdesk", "Comms", "Triage"],
    status: "upcoming",
  },
  {
    id: "smm-01",
    title: "Social Media Marketer (SMM)",
    dept: "Marketing",
    location: "Remote",
    type: "Full-time",
    salaryMin: 0,
    salaryMax: 0,
    summary: "Content, social channels, community growth.",
    tags: ["Content", "Social", "Growth"],
    status: "upcoming",
  },
  {
    id: "des-01",
    title: "Product Designer",
    dept: "Design",
    location: "Remote",
    type: "Full-time",
    salaryMin: 0,
    salaryMax: 0,
    summary: "Design systems, visuals, prototypes, research.",
    tags: ["Design system", "Figma", "Prototyping"],
    status: "upcoming",
  },
]

const FILTERS = [
  { id: "All", label: "All" },
  { id: "Engineering", label: "Engineering" },
  { id: "QA", label: "QA" },
  { id: "Analytics", label: "Analytics" },
  { id: "Operations", label: "Operations" },
  { id: "Support", label: "Support" },
  { id: "Marketing", label: "Marketing" },
  { id: "Design", label: "Design" },
] as const

const DeptIcon: Record<Department, React.ComponentType<any>> = {
  Engineering: Code2,
  QA: Bug,
  Analytics: BarChart3,
  Operations: Users2,
  Support: Headset,
  Marketing: Megaphone,
  Design: Paintbrush,
}

const encodeJob = (job: any) => btoa(encodeURIComponent(JSON.stringify(job)))

export default function CareersPage() {
  const heroRef = useRef<HTMLElement>(null)
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const tone = mounted && resolvedTheme === "light" ? "light" : "dark"
  const router = useRouter()
  

  // hero parallax
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
          el.style.transform = `translateY(${p * 14}px)`
          el.style.opacity = `${Math.max(1 - p * 0.22, 0.82)}`
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("All")
  const visibleJobs = useMemo(
    () => (filter === "All" ? JOBS : JOBS.filter((j) => j.dept === filter)),
    [filter]
  )

  return (
    <div className="careers-page" data-tone={tone}>
      <BackgroundEffects />

      {/* HERO */}
      <section ref={heroRef} className="hero-section">
        <div className="hero-content">
          <img src={LOGO} alt="SaturnusGo" className="hero-logo-img" />
          <h1 className="hero-title">
            Careers <span className="hero-accent">— SaturnusGo</span>
          </h1>
          <p className="hero-subtitle">
            We’re investor-stage and assembling a lean A-team. Roles will open soon — you can already explore what’s coming.
          </p>

          <div className="hero-badges">
            <span className="chip soon">
              <Info className="chip-ic" />
              Hiring soon
            </span>
            <span className="chip meta">All salaries TBD (set to 0 for now)</span>
          </div>

          {/* Department filters */}
          <div className="pill-scroll" role="tablist" aria-label="Departments">
            <div className="pill-track">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  role="tab"
                  aria-selected={filter === f.id}
                  className={`pill ${filter === f.id ? "pill-on" : ""}`}
                  onClick={() => setFilter(f.id)}
                  title={f.label}
                >
                  <span className="nowrap">{f.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* JOBS GRID */}
      <main className="jobs-wrap">
        {visibleJobs.length === 0 ? (
          <div className="empty">
            <p>No roles in this department yet. Try a different filter.</p>
          </div>
        ) : (
          <div className="jobs-grid">
            {visibleJobs.map((job) => {
              const Icon = DeptIcon[job.dept]
              return (
                <article key={job.id} className="job-card" aria-labelledby={`${job.id}-title`}>
                  <div className="job-head">
                    <div className="dept-ic">
                      <Icon />
                    </div>
                    <div className="job-titles">
                      <h3 id={`${job.id}-title`} className="job-title">
                        {job.title}
                      </h3>
                      <div className="job-meta">
                        <span className="meta">
                          <MapPin className="meta-ic" />
                          {job.location}
                        </span>
                        <span className="meta">
                          <Clock className="meta-ic" />
                          {job.type}
                        </span>
                        <span className="badge upcoming">Upcoming</span>
                      </div>
                    </div>
                  </div>

                  <p className="job-summary">{job.summary}</p>

                  <div className="tags">
                    {job.tags.map((t) => (
                      <span key={t} className="tag">
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="salary">
                    Salary: <strong>${job.salaryMin} – ${job.salaryMax}</strong>
                  </div>

                  <div className="job-actions">
                  <Link
                      className="btn"
                      href={{
                        pathname: `/partners/careers/${job.id}`, // без трейлинг-слэша
                        query: { data: encodeURIComponent(JSON.stringify(job)) },
                      }}
                      onClick={() => {
                        try { localStorage.setItem("sg_last_job", JSON.stringify(job)); } catch {}
                      }}
                    >
                      View role
                      <ArrowRight className="btn-ic" />
                    </Link>
                    <a className="btn ghost" href="/support">
                      Notify me
                    </a>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>

      <style jsx global>{`
        /* ============================
           TOKENS — DARK (default)
        =============================*/
        .careers-page {
          --bg-0:#0a0b0d; --bg-1:#0f1115; --grid:rgba(255,255,255,.035);
          --txt:#e7e9ee; --txt-2:#c2c6cf; --txt-3:#9aa0a6;
          --ink:#e9ebf2; --ink-2:#cbd1dc;
          --primary:#646cff; --primary-hover:#5a63f0;

          --white-02:rgba(255,255,255,.02);
          --white-06:rgba(255,255,255,.06);
          --white-08:rgba(255,255,255,.08);
          --white-12:rgba(255,255,255,.12);

          --radius-lg:20px; --radius-xl:28px;
          --shadow-1:0 10px 30px rgba(0,0,0,.28), 0 1px 0 rgba(255,255,255,.02) inset;

          min-height:100vh;
          background:
            radial-gradient(1100px 560px at 50% -10%, rgba(100,108,255,.08), transparent),
            linear-gradient(135deg, var(--bg-0) 0%, var(--bg-1) 55%, var(--bg-0) 100%);
          color:var(--txt);
          font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, system-ui, sans-serif;
        }

        /* ============================
           TOKENS — LIGHT
        =============================*/
        .careers-page[data-tone='light'],
        :global(html.light) .careers-page {
          --bg-0:#f6f8fb; --bg-1:#ffffff; --grid:rgba(2,6,23,.06);
          --txt:#0f172a; --txt-2:#475569; --txt-3:#64748b;
          --ink:#0b1220; --ink-2:#334155;

          background:
            radial-gradient(1100px 560px at 50% -10%, rgba(100,108,255,.09), transparent),
            linear-gradient(135deg, var(--bg-0) 0%, var(--bg-1) 55%, var(--bg-0) 100%);
          color:var(--txt);
        }

        /* ============ HERO ============ */
        .hero-section{
          position:relative; min-height:85vh;
          display:flex; align-items:center; justify-content:center;
          padding:92px 24px 80px; text-align:center;
        }
        .hero-content{max-width:920px; width:100%}
        .hero-logo-img{
          max-width:120px; height:auto; margin:0 auto 24px; display:block;
          filter:drop-shadow(0 10px 20px rgba(0,0,0,.35));
        }
        .careers-page[data-tone='light'] .hero-logo-img,
        :global(html.light) .careers-page .hero-logo-img {
          filter: drop-shadow(0 8px 16px rgba(2,6,23,.12));
        }
        .hero-title{
          font-size:clamp(44px,7vw,84px); font-weight:850; letter-spacing:-.02em; line-height:1.06; margin:0 0 12px;
          background:linear-gradient(to right, var(--ink), var(--ink-2)); -webkit-background-clip:text; background-clip:text; color:transparent;
        }
        .hero-accent{ color: var(--primary); }
        .hero-subtitle{
          font-size:20px; line-height:1.7; color:var(--txt-2); max-width:760px; margin:0 auto 10px;
        }
        .hero-badges{ display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-top:8px; }
        .chip{
          display:inline-flex; align-items:center; gap:8px; padding:8px 12px; border-radius:999px;
          border:1px solid var(--white-12); background:var(--white-08); color:var(--txt-2); font-weight:800; font-size:12px;
        }
        .chip.soon{ background: color-mix(in oklab, var(--primary) 14%, transparent); border-color: color-mix(in oklab, var(--primary) 40%, transparent); color:#fff; }
        .chip .chip-ic{ width:14px; height:14px }

        /* ============ FILTER PILLS ============ */
        .pill-scroll{ overflow-x:auto; -webkit-overflow-scrolling:touch; margin:18px auto 0; }
        .pill-track{ display:inline-flex; gap:12px; padding:8px; justify-content:center; }
        .pill{
          display:inline-flex; align-items:center; gap:8px; padding:12px 18px; border-radius:999px;
          background: var(--white-06); border:1px solid var(--white-12);
          color:var(--txt-2); font-weight:800; white-space:nowrap; cursor:pointer; transition: all .2s ease;
        }
        .pill-on{ background: var(--primary); color:#fff; border-color: transparent; }

        /* ============ JOBS GRID ============ */
        .jobs-wrap{ max-width:1200px; margin: 0 auto; padding: 0 24px 110px; }
        .jobs-grid{ display:grid; gap:16px; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-top: 18px; }
        .job-card{
          background: var(--white-08); border:1px solid var(--white-12); border-radius: var(--radius-xl);
          padding: 18px; box-shadow: var(--shadow-1); display:flex; flex-direction:column; gap:12px;
          transition: transform .2s ease, background .2s ease, border-color .2s ease;
        }
        .job-card:hover{ transform: translateY(-3px); background: var(--white-06); }

        .job-head{ display:grid; grid-template-columns: auto 1fr; gap:12px; align-items:center; }
        .dept-ic{
          width:42px; height:42px; border-radius:14px; display:grid; place-items:center;
          background: var(--primary); color:#fff;
        }
        .dept-ic svg{ width:20px; height:20px }
        .job-title{
          margin:0; font-size:18px; font-weight:900; letter-spacing:-.01em;
          background: linear-gradient(to right, var(--txt), var(--txt-2)); -webkit-background-clip:text; background-clip:text; color:transparent;
        }
        .job-meta{ display:flex; gap:10px; flex-wrap:wrap; margin-top:4px; }
        .meta{
          display:inline-flex; align-items:center; gap:6px; color:var(--txt-3); font-size:12px; font-weight:700;
          background: var(--white-06); border:1px solid var(--white-12); border-radius:999px; padding:6px 8px;
        }
        .meta-ic{ width:14px; height:14px }
        .badge.upcoming{
          display:inline-flex; align-items:center; gap:6px; padding:6px 8px; border-radius:999px; font-size:12px; font-weight:900;
          color:#fff; background: color-mix(in oklab, var(--primary) 70%, black 0%);
        }

        .job-summary{ color:var(--txt-2); line-height:1.7; margin: 2px 0 0; }
        .tags{ display:flex; flex-wrap:wrap; gap:8px; }
        .tag{
          padding:6px 10px; border-radius:999px; font-size:12px; font-weight:800;
          background: rgba(100,108,255,.1); border:1px solid rgba(100,108,255,.2); color: var(--primary);
        }
        .salary{ color: var(--txt-3); font-size:13px; }
        .salary strong{ color: var(--txt); }

        .job-actions{ display:flex; gap:8px; margin-top:auto; }
        .btn{
          display:inline-flex; align-items:center; gap:8px; padding:12px 14px; border-radius:14px; font-weight:800; cursor:pointer;
          border:1px solid var(--white-12); background: var(--white-06); color: var(--txt); text-decoration:none;
        }
        .btn.disabled{ opacity:.7; cursor:not-allowed }
        .btn.ghost:hover{ background: var(--white-08); }
        .btn-ic{ width:16px; height:16px }

        .empty{
          margin: 18px auto 0; padding: 16px; max-width: 680px; text-align:center;
          border:1px solid var(--white-12); border-radius: 14px; background: var(--white-06); color: var(--txt-2);
        }

        /* ============ RESPONSIVE ============ */
        @media (max-width: 720px){
          .job-head{ grid-template-columns: 1fr; align-items:start; }
          .dept-ic{ width:36px; height:36px; border-radius:12px }
        }

        /* Focus */
        :is(a, button):focus-visible{
          outline:none; box-shadow:0 0 0 6px rgba(100,108,255,.25), 0 0 0 2px var(--primary);
          border-radius:12px;
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce){
          .hero-section { transform:none !important; opacity:1 !important; }
        }
      `}</style>
    </div>
  )
}
