"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  MapPin, Clock, BadgeDollarSign, Tag, ArrowLeft, ArrowRight,
  CheckCircle2, ListChecks, Sparkles, Wrench, Users2, Info,
} from "lucide-react";
import type { Job } from "../../../../../shared/lib/jobs";

/* ===============================
   Background Grid
=============================== */
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
);

/* ===============================
   Helpers
=============================== */
function decodeJobFromURL(param?: string | null): Job | null {
  if (!param) return null;
  try { return JSON.parse(decodeURIComponent(param)); } catch {}
  try {
    const b64 = param.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, "+");
    const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
    return JSON.parse(decodeURIComponent(atob(b64 + pad)));
  } catch { return null; }
}

function salaryLabel(min: number, max: number) {
  if (!min && !max) return "TBD";
  if (min && max) return `$${min.toLocaleString()} – $${max.toLocaleString()}`;
  if (min) return `from $${min.toLocaleString()}`;
  return `up to $${max.toLocaleString()}`;
}

export default function JobDetailClient({
  id,
  initialJob,
}: {
  id: string;
  initialJob: Job | null;
}) {
  const heroRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const search = useSearchParams();

  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const tone = mounted && resolvedTheme === "light" ? "light" : "dark";

  // Parallax
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const y = window.scrollY;
          const h = el.offsetHeight || 1;
          const p = Math.min(y / (h * 0.6), 1);
          el.style.transform = `translateY(${p * 14}px)`;
          el.style.opacity = `${Math.max(1 - p * 0.22, 0.82)}`;
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Resolve job: URL payload -> initial static -> localStorage
  const [job, setJob] = useState<Job | null>(initialJob);
  useEffect(() => {
    const fromUrl = decodeJobFromURL(search.get("data"));
    if (fromUrl) {
      setJob(fromUrl);
      try { localStorage.setItem("sg_last_job", JSON.stringify(fromUrl)); } catch {}
      return;
    }
    if (!initialJob) {
      try {
        const raw = localStorage.getItem("sg_last_job");
        if (raw) setJob(JSON.parse(raw) as Job);
      } catch {}
    }
  }, [search, initialJob]);

  const metaChips = useMemo(() => {
    if (!job) return [];
    return [
      { icon: MapPin, label: job.location },
      { icon: Clock, label: job.type },
      { icon: BadgeDollarSign, label: salaryLabel(job.salaryMin, job.salaryMax) },
      { icon: Tag, label: job.status === "upcoming" ? "Upcoming" : "Open" },
    ];
  }, [job]);

  const defaultAbout =
    "You’ll help build SaturnusGo’s unified travel experience — from ride flows to bookings — with quality, performance, and craft.";
  const defaultResponsibilities = [
    "Own core features end-to-end with pragmatic scope.",
    "Collaborate cross-functionally with Design, Ops, and Product.",
    "Raise the quality bar: code reviews, tests, DX, and docs.",
  ];
  const defaultRequirements = [
    "Strong ownership and product taste.",
    "Solid experience with modern web/app stack.",
    "Clear communication in English.",
  ];
  const defaultNice = ["Startup experience", "Taste for design/UX", "Data-informed mindset"];
  const defaultTools = ["Figma", "Jira/Linear", "GitHub", "Notion", "Slack"];
  const defaultBenefits = [
    "Remote-friendly setup",
    "Flexible hours around core overlap",
    "Ownership mindset and visible impact",
  ];

  return (
    <div className="job-page" data-tone={tone}>
      <BackgroundEffects />

      {/* HERO */}
      <section ref={heroRef} className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            {job?.title || "Role"}
            <span className="hero-accent"> — {job?.dept ?? "Department"}</span>
          </h1>
          <p className="hero-subtitle">
            {job?.summary || "Craft, ownership, and momentum. Help us build the future of integrated travel."}
          </p>

          <div className="hero-meta">
            {metaChips.map((c, i) => {
              const Icon = c.icon;
              return (
                <span key={i} className="chip">
                  <Icon className="chip-ic" />
                  {c.label}
                </span>
              );
            })}
            {job?.status === "upcoming" && (
              <span className="chip soon">
                <Info className="chip-ic" />
                Hiring soon
              </span>
            )}
          </div>

          <div className="hero-actions">
            <button className="btn primary" disabled>
              Apply (coming soon)
              <ArrowRight className="btn-ic" />
            </button>
            <button className="btn ghost" onClick={() => router.push("/partners/careers/")}>
              <ArrowLeft className="btn-ic" />
              Back to Careers
            </button>
          </div>
        </div>
      </section>

      {/* BODY */}
      <main className="wrap">
        {!job ? (
          <div className="error">Couldn’t load the role. Open it from the Careers page again.</div>
        ) : (
          <div className="grid">
            <article className="card main">
              <section className="block">
                <h2 className="block-title">
                  <Sparkles className="block-ic" /> About the role
                </h2>
                <p className="lead">{job.about || defaultAbout}</p>
              </section>

              <section className="block">
                <h2 className="block-title">
                  <ListChecks className="block-ic" /> Responsibilities
                </h2>
                <ul className="list">
                  {(job.responsibilities?.length ? job.responsibilities : defaultResponsibilities).map((it, i) => (
                    <li key={`r-${i}`}>{it}</li>
                  ))}
                </ul>
              </section>

              <section className="block">
                <h2 className="block-title">
                  <CheckCircle2 className="block-ic" /> Requirements
                </h2>
                <ul className="list">
                  {(job.requirements?.length ? job.requirements : defaultRequirements).map((it, i) => (
                    <li key={`req-${i}`}>{it}</li>
                  ))}
                </ul>
              </section>

              <section className="block">
                <h2 className="block-title">
                  <Users2 className="block-ic" /> Nice to have
                </h2>
                <ul className="list">
                  {(job.niceToHave?.length ? job.niceToHave : defaultNice).map((it, i) => (
                    <li key={`nice-${i}`}>{it}</li>
                  ))}
                </ul>
              </section>

              <section className="block">
                <h2 className="block-title">
                  <Wrench className="block-ic" /> Stack & Tools
                </h2>
                <div className="tags">
                  {(job.tools?.length ? job.tools : defaultTools).map((t) => (
                    <span key={t} className="tag">{t}</span>
                  ))}
                  {job.tags.map((t) => (
                    <span key={`tag-${t}`} className="tag alt">{t}</span>
                  ))}
                </div>
              </section>

              <section className="block">
                <h2 className="block-title">
                  <Sparkles className="block-ic" /> Benefits & Perks
                </h2>
                <ul className="list">
                  {(job.benefits?.length ? (job as any).benefits : defaultBenefits).map((it: string, i: number) => (
                    <li key={`ben-${i}`}>{it}</li>
                  ))}
                </ul>
              </section>

              <section className="block">
                <h2 className="block-title">
                  <ListChecks className="block-ic" /> Hiring process
                </h2>
                <ol className="steps">
                  <li>Quick intro call (15–20 min)</li>
                  <li>Deep dive with lead (skill & product sense)</li>
                  <li>Small paid task or portfolio walkthrough</li>
                  <li>Offer & start plan</li>
                </ol>
              </section>

              <div className="cta-row">
                <button className="btn primary" disabled>
                  Apply (coming soon)
                  <ArrowRight className="btn-ic" />
                </button>
                <a className="btn ghost" href="/support">Notify me</a>
              </div>
            </article>

            <aside className="card side">
              <h3 className="side-title">Key facts</h3>
              <ul className="facts">
                <li><span>Role</span><code>{job.title}</code></li>
                <li><span>Department</span><code>{job.dept}</code></li>
                <li><span>Location</span><code>{job.location}</code></li>
                <li><span>Type</span><code>{job.type}</code></li>
                <li><span>Salary</span><code>{salaryLabel(job.salaryMin, job.salaryMax)}</code></li>
                <li><span>Status</span><code>{job.status === "upcoming" ? "Upcoming" : "Open"}</code></li>
                <li className="muted"><span>Job ID</span><code>{id}</code></li>
              </ul>
            </aside>
          </div>
        )}
      </main>

      {/* STYLES */}
         {/* STYLES */}
         <style jsx global>{`
        /* ============================
           TOKENS — DARK
        =============================*/
        .job-page {
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
        .job-page[data-tone='light'],
        :global(html.light) .job-page {
          --bg-0:#f6f8fb; --bg-1:#ffffff; --grid:rgba(2,6,23,.06);
          --txt:#0f172a; --txt-2:#475569; --txt-3:#64748b;
          --ink:#0b1220; --ink-2:#334155;

          background:
            radial-gradient(1100px 560px at 50% -10%, rgba(100,108,255,.09), transparent),
            linear-gradient(135deg, var(--bg-0) 0%, var(--bg-1) 55%, var(--bg-0) 100%);
          color:var(--txt);
        }

        /* HERO */
        .hero-section{
          position:relative; min-height:64vh;
          display:flex; align-items:center; justify-content:center;
          padding:96px 24px 64px; text-align:center;
        }
        .hero-content{ max-width:920px; width:100% }
        .hero-title{
          font-size:clamp(44px,7vw,84px); font-weight:850; letter-spacing:-.02em; line-height:1.06; margin:0 0 12px;
          background:linear-gradient(to right, var(--ink), var(--ink-2)); -webkit-background-clip:text; background-clip:text; color:transparent;
        }
        .hero-accent{ color: var(--primary); }
        .hero-subtitle{ font-size:20px; line-height:1.7; color:var(--txt-2); max-width:780px; margin:0 auto 16px; }
        .hero-meta{ display:flex; gap:10px; justify-content:center; flex-wrap:wrap; }
        .chip{
          display:inline-flex; align-items:center; gap:8px; padding:8px 12px; border-radius:999px;
          border:1px solid var(--white-12); background:var(--white-08); color:var(--txt-2); font-weight:800; font-size:12px;
        }
        .chip .chip-ic{ width:14px; height:14px }
        .chip.soon{
          background: color-mix(in oklab, var(--primary) 14%, transparent);
          border-color: color-mix(in oklab, var(--primary) 40%, transparent);
          color:#fff;
        }
        .hero-actions{ display:flex; gap:10px; justify-content:center; margin-top:14px; flex-wrap:wrap; }

        /* LAYOUT */
        .wrap{ max-width:1200px; margin: 0 auto; padding: 0 24px 110px; }
        .grid{ display:grid; grid-template-columns: 1.6fr 1fr; gap: 24px; align-items:start; }
        @media (max-width: 980px){ .grid{ grid-template-columns: 1fr } }

        .card{
          background: var(--white-08); border:1px solid var(--white-12);
          border-radius: var(--radius-xl); box-shadow: var(--shadow-1);
        }
        .main{ padding: 18px; }
        .side{ padding: 18px; position: sticky; top: 16px; height: fit-content; }

        /* BLOCKS */
        .block{ margin: 10px 0 16px; }
        .block-title{
          display:flex; align-items:center; gap:10px;
          margin: 0 0 8px; font-size: 18px; font-weight: 900; letter-spacing:-.01em;
          background: linear-gradient(to right, var(--txt), var(--txt-2)); -webkit-background-clip:text; background-clip:text; color:transparent;
        }
        .block-ic{ width:18px; height:18px; color: var(--primary); flex: 0 0 auto; }
        .lead{ color: var(--txt-2); line-height: 1.8; }

        .list{ margin: 0; padding-left: 1.2em; color: var(--txt-2); line-height:1.8; }
        .list li{ margin: 0 0 6px; }

        .tags{ display:flex; flex-wrap:wrap; gap:8px; }
        .tag{
          padding:6px 10px; border-radius:999px; font-size:12px; font-weight:800;
          background: rgba(100,108,255,.1); border:1px solid rgba(100,108,255,.2); color: var(--primary);
        }
        .tag.alt{
          background: var(--white-06); border:1px solid var(--white-12); color: var(--txt-2);
        }

        .steps{ margin: 0; padding-left: 1.2em; color: var(--txt-2); line-height:1.8; }
        .steps li{ margin: 0 0 6px; }

        .cta-row{ display:flex; gap:10px; flex-wrap:wrap; margin-top: 10px; }

        /* SIDEBAR */
        .side-title{
          margin: 6px 0 12px; font-weight: 900; letter-spacing:.01em;
          background: linear-gradient(to right, var(--txt), var(--txt-2)); -webkit-background-clip:text; background-clip:text; color:transparent;
        }
        .facts{
          list-style:none; margin:0; padding:0; display:grid; gap:8px;
        }
        .facts li{
          display:grid; grid-template-columns: 1fr auto; gap: 10px; align-items:center; color: var(--txt-2);
          padding: 8px 10px; border-radius: 12px; background: var(--white-06); border:1px solid var(--white-12);
        }
        .facts li.muted{ opacity:.9 }
        .facts code{ color: var(--txt-3); font-size: 12px; padding: 2px 6px; background: var(--white-08); border:1px solid var(--white-12); border-radius: 8px; }

        /* BUTTONS */
        .btn{
          display:inline-flex; align-items:center; gap:8px; padding:12px 16px;
          border-radius:14px; border:1px solid var(--white-12);
          background: var(--white-06); color: var(--txt); font-weight: 800; cursor: pointer; text-decoration: none;
        }
        .btn.primary{ background: var(--primary); border-color: var(--primary); color:#fff; }
        .btn.primary:disabled{ opacity:.7; cursor:not-allowed }
        .btn.ghost:hover{ background: var(--white-08); }
        .btn-ic{ width:16px; height:16px }

        .error{
          margin: 18px auto 0; padding: 16px; max-width: 680px; text-align:center;
          border:1px solid var(--white-12); border-radius: 14px; background: var(--white-06); color: var(--txt-2);
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
  );
}
