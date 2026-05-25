"use client"

import { useEffect, useRef } from "react"

export default function PartnersHero() {
  const heroRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const hero = heroRef.current
    const title = titleRef.current
    const subtitle = subtitleRef.current
    if (!hero || !title || !subtitle) return

    const handleScroll = () => {
      const scrollY = window.scrollY
      const heroHeight = hero.offsetHeight
      const progress = Math.min(scrollY / heroHeight, 1)
      title.style.transform = `translateY(${progress * 40}px) scale(${1 - progress * 0.05})`
      subtitle.style.transform = `translateY(${progress * 60}px)`
      title.style.opacity = `${1 - progress * 0.6}`
      subtitle.style.opacity = `${1 - progress * 0.7}`
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <section ref={heroRef} className="partners-hero">
      <div className="hero-background">
        <div className="hero-orb-1" />
        <div className="hero-orb-2" />
        <div className="hero-orb-3" />
        <div className="hero-grid" />
        <div className="hero-radial" />
      </div>

      <div className="hero-content">
        <div className="hero-badge">
          <div className="hero-badge-dot" />
          Strategic Partnerships
          <div className="hero-badge-dot-2" />
        </div>

        <h1 ref={titleRef} className="hero-title">
          SaturnusGo Hospitality
          <span className="hero-title-accent">Excellence</span>
        </h1>

        <p ref={subtitleRef} className="hero-subtitle">
          Strategic partnerships with premier restaurants, hotels, and venues delivering seamless integrated
          experiences.
        </p>
      </div>

      <div className="hero-scroll">
        <div className="hero-scroll-indicator">
          <div className="hero-scroll-dot" />
        </div>
      </div>

      <style jsx>{`
        :root {
          --bg-0: #0a0b0d;
          --bg-1: #0f1115;
          --glass-xxs: rgba(12, 14, 17, 0.12);
          --glass-xs: rgba(12, 14, 17, 0.18);
          --glass-sm: rgba(12, 14, 17, 0.24);
          --glass-md: rgba(12, 14, 17, 0.32);
          --glass-lg: rgba(12, 14, 17, 0.42);
          --ring: rgba(255, 255, 255, 0.12);
          --stroke: rgba(255, 255, 255, 0.08);
          --grid: rgba(255, 255, 255, 0.035);
          --sheen: rgba(255, 255, 255, 0.06);
          --txt: #e7e9ee;
          --txt-2: #c2c6cf;
          --txt-3: #9aa0a6;
          --white-08: rgba(255, 255, 255, 0.08);
          --white-12: rgba(255, 255, 255, 0.12);
          --white-16: rgba(255, 255, 255, 0.16);
          --white-02: rgba(255, 255, 255, 0.02);
        }

        .partners-hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: linear-gradient(135deg, var(--bg-0) 0%, var(--bg-1) 50%, var(--bg-0) 100%);
        }

        .hero-background {
          position: absolute;
          inset: 0;
        }

        .hero-orb-1,
        .hero-orb-2,
        .hero-orb-3 {
          position: absolute;
          border-radius: 50%;
          filter: blur(48px);
          animation: pulse 2s infinite;
          background: var(--white-08);
        }
        .hero-orb-1 {
          top: 25%;
          left: 25%;
          width: 384px;
          height: 384px;
        }
        .hero-orb-2 {
          bottom: 25%;
          right: 25%;
          width: 320px;
          height: 320px;
          animation-delay: 1s;
        }
        .hero-orb-3 {
          top: 75%;
          left: 75%;
          width: 256px;
          height: 256px;
          animation-delay: 2s;
        }

        .hero-grid {
          position: absolute;
          inset: 0;
          background-image: linear-gradient(var(--grid) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid) 1px, transparent 1px);
          background-size: 100px 100px;
        }

        .hero-radial {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 50%, var(--white-12), transparent 70%);
        }

        .hero-content {
          position: relative;
          z-index: 10;
          text-align: center;
          padding: 0 24px;
          max-width: 900px;
          margin: 0 auto;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 12px 24px;
          margin-bottom: 24px;
          font-size: 14px;
          font-weight: 600;
          color: var(--txt-2);
          background: var(--glass-xs);
          border-radius: 9999px;
          border: 1px solid var(--stroke);
          backdrop-filter: blur(6px);
        }
        .hero-badge-dot,
        .hero-badge-dot-2 {
          width: 8px;
          height: 8px;
          background: var(--txt-2);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .hero-title {
          font-size: clamp(2.5rem, 6vw, 4.5rem);
          font-weight: 700;
          margin-bottom: 24px;
          background: linear-gradient(to right, #ffffff, rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0.55));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          line-height: 1.1;
          letter-spacing: -0.025em;
        }
        .hero-title-accent {
          display: block;
          background: linear-gradient(to right, #ffffff, rgba(255, 255, 255, 0.8));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .hero-subtitle {
          font-size: clamp(1rem, 1.5vw, 1.25rem);
          color: var(--txt-3);
          max-width: 600px;
          margin: 0 auto 32px;
          line-height: 1.6;
        }

        .hero-scroll {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          animation: bounce 1s infinite;
        }
        .hero-scroll-indicator {
          width: 24px;
          height: 40px;
          border: 2px solid var(--txt-3);
          border-radius: 20px;
          display: flex;
          justify-content: center;
        }
        .hero-scroll-dot {
          width: 4px;
          height: 12px;
          background: var(--txt-3);
          border-radius: 2px;
          margin-top: 8px;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        @keyframes bounce {
          0%,
          20%,
          53%,
          80%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          40%,
          43% {
            transform: translate3d(0, -30px, 0);
          }
          70% {
            transform: translate3d(0, -15px, 0);
          }
          90% {
            transform: translate3d(0, -4px, 0);
          }
        }

        @media (max-width: 768px) {
          .partners-hero {
            min-height: 60vh;
          }
          .hero-title {
            font-size: clamp(2rem, 8vw, 3rem);
          }
        }
      `}</style>
    </section>
  )
}
