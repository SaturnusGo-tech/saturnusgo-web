"use client"

import { useEffect, useRef } from "react"

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

export default function NewsPage() {
  const heroRef = useRef<HTMLElement>(null)

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
          el.style.opacity = `${Math.max(1 - p * 0.22, 0.8)}`
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className="page">
      <BackgroundEffects />

      <section ref={heroRef} className="hero">
        <div className="hero-inner">
          <h1 className="hero-title">News</h1>
          <p className="hero-meta">Latest updates from SaturnusGo</p>
        </div>
      </section>

      <section className="body">
        <div className="prose">
          <p className="lead">No news has been published yet. Please check back soon.</p>
        </div>
      </section>

      <style jsx global>{`
        .page { background:linear-gradient(135deg,#0a0b0d,#0f1115); color:#e7e9ee; font-family:ui-sans-serif,system-ui; min-height:100vh }
        .hero { min-height:50vh; display:grid; place-items:center; text-align:center; padding:80px 24px }
        .hero-title { font-size:clamp(44px,7vw,80px); font-weight:850; letter-spacing:-.02em; margin:0 0 8px;
          background:linear-gradient(to right,#e9ebf2,#cfd3da); -webkit-background-clip:text; color:transparent }
        .hero-meta { color:#c2c6cf; font-weight:600 }
        .body { padding:40px 24px 120px; max-width:800px; margin:0 auto; text-align:center }
        .lead { font-size:18px; color:#c2c6cf; }
      `}</style>
    </div>
  )
}
