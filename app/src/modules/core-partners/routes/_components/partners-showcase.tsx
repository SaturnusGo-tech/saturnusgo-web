// app/partners/_components/partners-showcase.tsx
"use client"

import { useRef, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { CheckCircle, Clock, ExternalLink, Sparkles, Zap } from "lucide-react"

export interface Partner {
  id: string
  name: string
  logo: string
  website?: string
  category?: "hospitality"
  description?: string
  partnership_type?: "strategic" | "integration" | "technology"
  established?: string
  status?: "active" | "pilot" | "expanding"
  employees?: string
  revenue?: string
  locations?: string
}

interface PartnersSectionProps {
  partners: Partner[]
}

const statusConfig = {
  active: {
    color: "var(--particle-primary)",
    icon: CheckCircle,
    label: "Active",
    bgColor: "color-mix(in oklab, var(--particle-primary) 12%, transparent)",
    borderColor: "color-mix(in oklab, var(--particle-primary) 20%, transparent)",
  },
  pilot: {
    color: "var(--sidebar-accent)",
    icon: Clock,
    label: "Pilot",
    bgColor: "color-mix(in oklab, var(--sidebar-accent) 12%, transparent)",
    borderColor: "color-mix(in oklab, var(--sidebar-accent) 20%, transparent)",
  },
  expanding: {
    color: "var(--secondary)",
    icon: Zap,
    label: "Expanding",
    bgColor: "color-mix(in oklab, var(--secondary) 12%, transparent)",
    borderColor: "color-mix(in oklab, var(--secondary) 20%, transparent)",
  },
} as const

const partnershipTypeLabels = {
  integration: "Technology Integration",
  strategic: "Strategic Alliance",
  technology: "Technology Partner",
} as const

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

/* ====== LIST ITEM ====== */
const PartnerListItem = ({ partner, index }: { partner: Partner; index: number }) => {
  const statusInfo = partner.status ? statusConfig[partner.status] : undefined
  const StatusIcon = statusInfo?.icon || CheckCircle

  const meta = useMemo(() => {
    const items: string[] = []
    if (partner.partnership_type)
      items.push(partnershipTypeLabels[partner.partnership_type] ?? partner.partnership_type)
    if (partner.established) items.push(`Since ${partner.established}`)
    return items
  }, [partner.partnership_type, partner.established])

  return (
    <motion.li
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className="group list-item"
    >
      <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow duration-200">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-lg bg-muted/50 border flex items-center justify-center overflow-hidden">
            <img
              src={partner.logo || "/placeholder.svg"}
              alt={`${partner.name} logo`}
              className="list-logo w-8 h-8 object-contain"
              loading="lazy"
            />
          </div>
        </div>

        <div className="list-main min-w-0 flex-1">
          <div className="list-title-row flex items-center justify-between mb-1 gap-2">
            <h3 className="list-name font-semibold text-foreground truncate">{partner.name}</h3>

            <div className="flex items-center gap-2 flex-shrink-0">
              {statusInfo && (
                <div
                  className="partner-status inline-flex items-center gap-2 h-7 px-3 rounded-full text-[12px] font-semibold leading-none whitespace-nowrap"
                  style={{ color: statusInfo.color, backgroundColor: statusInfo.bgColor }}
                >
                  <StatusIcon className="partner-status-icon w-3.5 h-3.5 shrink-0" />
                  <span className="partner-status-label hidden sm:inline truncate">{statusInfo.label}</span>
                </div>
              )}

              {partner.website && (
                <a
                  href={partner.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="list-link w-8 h-8 rounded-lg bg-muted/50 border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  aria-label={`Visit ${partner.name} website`}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {meta.length > 0 && <p className="list-meta text-sm text-muted-foreground mb-1">{meta.join(" · ")}</p>}
          {partner.description && (
            <p className="list-desc text-sm text-muted-foreground clamp-2 leading-relaxed">{partner.description}</p>
          )}
        </div>
      </div>
    </motion.li>
  )
}

/* ====== PAGE (LIST-ONLY) ====== */
export default function PartnersSection({ partners = [] }: PartnersSectionProps) {
  const heroRef = useRef<HTMLElement>(null)

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

  const marqueeLogos = useMemo(() => (partners.length ? [...partners, ...partners] : []), [partners])

  return (
    <div className="partners relative min-h-screen">
      <BackgroundEffects />

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="partners-hero relative min-h-screen flex flex-col items-center justify-center px-4 py-20"
      >
        <div className="hero-content relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="hero-badge inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4" />
            <span>Strategic Partnerships</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="hero-title text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-br from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent leading-tight"
          >
            SaturnusGo Hospitality
            <span className="hero-title-accent block text-primary">Excellence</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="hero-subtitle text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-12"
          >
            Strategic partnerships with premier restaurants, hotels, and venues delivering seamless integrated
            experiences through revolutionary technology.
          </motion.p>

          {marqueeLogos.length > 0 && (
            <motion.div
              className="brand-marquee"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <div className="brand-track">
                {marqueeLogos.map((p, i) => (
                  <div key={`${p.id}-${i}`} className="brand-item">
                    <img
                      src={p.logo || "/placeholder.svg"}
                      alt={`${p.name} logo`}
                      className="brand-logo"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Partners — LIST ONLY */}
      <section className="cards-container relative z-10 max-w-7xl mx-auto px-4 py-20">
        <motion.div
          className="cards-header text-center mb-12"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="cards-title text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Strategic Alliances
          </h2>
        </motion.div>

        <motion.ul
          key="list"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="partners-list flex flex-col gap-3"
        >
          {partners.map((partner, index) => (
            <PartnerListItem key={partner.id} partner={partner} index={index} />
          ))}
        </motion.ul>
      </section>

      {/* ===== GLOBAL CSS ===== */}
      <style jsx global>{`
        /* ---- Design tokens ---- */
        :root {
          --background: oklch(1 0 0);
          --foreground: oklch(0.205 0 0);
          --card: oklch(1 0.02 0 / 0.8);
          --card-foreground: oklch(0.205 0 0);
          --popover: oklch(1 0.02 0 / 0.9);
          --popover-foreground: oklch(0.205 0 0);
          --primary: oklch(0.646 0.222 280.116);
          --primary-foreground: oklch(1 0 0);
          --secondary: oklch(0.97 0.01 240);
          --secondary-foreground: oklch(0.205 0 0);
          --muted: oklch(0.556 0.02 240);
          --muted-foreground: oklch(1 0 0);
          --accent: oklch(0.769 0.188 70.08);
          --accent-foreground: oklch(1 0 0);
          --destructive: oklch(0.577 0.245 27.325);
          --destructive-foreground: oklch(1 0 0);
          --border: oklch(0.922 0.01 240);
          --input: oklch(0.985 0.01 240);
          --ring: oklch(0.646 0.222 280.116 / 0.5);

          --holographic-primary: linear-gradient(
            135deg,
            oklch(0.646 0.222 280.116 / 0.8),
            oklch(0.769 0.188 70.08 / 0.6)
          );
          --holographic-secondary: linear-gradient(135deg, oklch(1 0.02 0 / 0.1), oklch(0.97 0.01 240 / 0.2));
          --glass-surface: oklch(1 0.02 0 / 0.05);
          --glass-border: oklch(1 0.02 0 / 0.1);
          --neon-glow: 0 0 20px oklch(0.646 0.222 280.116 / 0.3);
          --depth-shadow: 0 25px 50px -12px oklch(0.205 0 0 / 0.25);
          --particle-primary: oklch(0.646 0.222 280.116);
          --particle-secondary: oklch(0.769 0.188 70.08);
          --hologram-shimmer: linear-gradient(45deg, transparent 30%, oklch(1 0 0 / 0.1) 50%, transparent 70%);
        }

        .partners {
          --bg-0: #0a0b0d;
          --bg-1: #0f1115;
          --grid: rgba(255, 255, 255, 0.035);
          --sheen: rgba(255, 255, 255, 0.06);
          --txt: #e7e9ee;
          --txt-2: #c2c6cf;
          --txt-3: #9aa0a6;
          --white-02: rgba(255, 255, 255, 0.02);
          --white-08: rgba(255, 255, 255, 0.08);
          --white-12: rgba(255, 255, 255, 0.12);
          --radius-md: 14px;
          --radius-lg: 20px;
          --radius-xl: 28px;
          --radius-2xl: 32px;
          --shadow-1: 0 10px 30px rgba(0, 0, 0, 0.28), 0 1px 0 rgba(255, 255, 255, 0.02) inset;
          --shadow-2: 0 24px 60px -20px rgba(0, 0, 0, 0.5);
          --marquee-duration: 30s;
          position: relative;
          width: 100%;
          overflow: hidden;
          background: linear-gradient(135deg, var(--bg-0) 0%, var(--bg-1) 50%, var(--bg-0) 100%);
        }

        /* ===== HERO ===== */
        .partners-hero {
          overflow: hidden;
        }
        .hero-content {
          text-align: center;
        }
        .hero-badge {
          border-radius: 9999px;
        }
        .hero-title {
          letter-spacing: -0.01em;
        }
        .hero-subtitle {
          line-height: 1.6;
        }
        

        /* ===== Brand Marquee ===== */
        .brand-marquee {
          --mask-edge: 10%;
          width: 100%;
          margin-top: calc(clamp(16px, 4vh, 40px) + 150px);
          overflow: hidden;
          mask: linear-gradient(
            90deg,
            transparent 0%,
            black var(--mask-edge),
            black calc(100% - var(--mask-edge)),
            transparent 100%
          );
          -webkit-mask: linear-gradient(
            90deg,
            transparent 0%,
            black var(--mask-edge),
            black calc(100% - var(--mask-edge)),
            transparent 100%
          );
        }
        .brand-track {
          display: inline-flex;
          gap: clamp(24px, 4vw, 56px);
          width: max-content;
          animation: marquee var(--marquee-duration) linear infinite;
          will-change: transform;
        }
        .brand-marquee:hover .brand-track {
          animation-play-state: paused;
        }
        @keyframes marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        .brand-item {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: clamp(128px, 24vw, 184px);
          height: clamp(72px, 12vw, 112px);
          border-radius: var(--radius-xl);
          backdrop-filter: blur(14px);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
          box-shadow: var(--shadow-1);
          transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
        }
        .brand-item:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-2);
        }
        .brand-logo {
          max-width: clamp(90px, 18vw, 132px);
          max-height: clamp(44px, 8vw, 72px);
          object-fit: contain;
          filter: brightness(0.96) contrast(1.08);
        }

        /* ===== Container / Headings ===== */
        .cards-container {
          max-width: 1100px;
        }
        .cards-title {
          background: linear-gradient(to right, #fff, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.58));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        /* ===== Pills ===== */
        .partner-status {
          box-sizing: border-box;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 28px;
          padding: 0 12px;
          border-radius: 9999px;
          line-height: 1;
          white-space: nowrap;
        }
        .partner-status-icon {
          width: 14px;
          height: 14px;
          flex: 0 0 14px;
        }
        .partner-status-label {
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ===== List view ===== */
        .list-item {
          list-style: none;
        }
        .list-link svg {
          width: 16px;
          height: 16px;
        }

        /* ===== Clamp utils ===== */
        .clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
