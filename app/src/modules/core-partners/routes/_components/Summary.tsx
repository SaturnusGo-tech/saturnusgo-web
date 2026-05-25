"use client"

import { useEffect, useRef } from "react"

export interface Partner {
  id: string
  name: string
  logo: string // прямые ссылки на PNG/SVG
  website?: string
  category?: "hospitality"
  description?: string
  partnership_type?: "strategic" | "integration" | "technology"
  established?: string
  status?: "active" | "pilot" | "expanding"
}

interface PartnersMarqueeProps {
  partners: Partner[]
}

export default function PartnersMarquee({ partners }: PartnersMarqueeProps) {
  const marqueeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const marquee = marqueeRef.current
    if (!marquee) return

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) return

    // Берём первую дорожку, клонируем для бесшовного цикла
    const track = marquee.querySelector(".marquee__track") as HTMLElement | null
    if (!track) return

    const clone = track.cloneNode(true) as HTMLElement
    marquee.appendChild(clone)

    // Вычисляем длительность из ширины контента (чем шире — тем дольше)
    const totalWidth = track.scrollWidth
    const duration = Math.max(20, totalWidth / 60) // подстройка скорости
    marquee.style.setProperty("--marquee-duration", `${duration}s`)

    marquee.classList.add("marquee--animated")

    return () => {
      if (clone && marquee.contains(clone)) marquee.removeChild(clone)
      marquee.classList.remove("marquee--animated")
    }
  }, [])

  return (
    <section aria-label="Partners logos" className="marquee-section">
      <div ref={marqueeRef} className="marquee" role="list" aria-roledescription="marquee">
        <div className="marquee__track">
          {partners.map((p) => (
            <div key={p.id} className="marquee__item" role="listitem" aria-label={p.name}>
              {/* Только логотипы, без текста */}
              <img src={p.logo} alt={`${p.name} logo`} height={40} loading="lazy" draggable={false} />
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .marquee-section {
          padding: 0;
        }
        .marquee {
          --gap: 48px;
          --logo-h: 40px;
          --marquee-duration: 30s;
          display: flex;
          overflow: hidden;
          align-items: center;
          /* плавное затемнение по краям */
          -webkit-mask-image: linear-gradient(
            to right,
            transparent 0%,
            black 8%,
            black 92%,
            transparent 100%
          );
          mask-image: linear-gradient(
            to right,
            transparent 0%,
            black 8%,
            black 92%,
            transparent 100%
          );
          cursor: default;
          user-select: none;
        }
        .marquee__track {
          display: inline-flex;
          align-items: center;
          gap: var(--gap);
          flex-shrink: 0;
          will-change: transform;
        }
        .marquee--animated .marquee__track {
          animation: marquee var(--marquee-duration) linear infinite;
        }
        /* Пауза при наведении курсора */
        .marquee--animated:hover .marquee__track {
          animation-play-state: paused;
        }
        .marquee__item {
          display: flex;
          align-items: center;
          justify-content: center;
          height: var(--logo-h);
          flex: 0 0 auto;
        }
        .marquee__item img {
          height: var(--logo-h);
          width: auto;
          opacity: 0.9;
          filter: contrast(1.05) brightness(0.98);
          transition: opacity 0.2s ease, filter 0.2s ease, transform 0.2s ease;
          transform: translateZ(0);
        }
        .marquee__item img:hover {
          opacity: 1;
          filter: none;
        }
        @keyframes marquee {
          to {
            transform: translateX(-100%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee__track {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </section>
  )
}
