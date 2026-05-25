// app/components/home/Hero.tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import usePdfDemoDialog from '../../../../modules/core-home/services/pdf-demo-dialog';

export default function Hero(){
  const ref = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [word, setWord] = useState(0);
  const words = ['Move', 'Book', 'Explore', 'Go'];

  // PDF dialog hook
  const { Dialog, openDialog } = usePdfDemoDialog({
    url: '/SG-P.pdf',
    rememberKey: 'skipDeckWarning',
  });

  // Parallax (без изменений)
  useEffect(() => {
    const el = ref.current; if (!el) return;
    let raf = 0, ty = 0, target = 0;
    const onScroll = () => { target = (window.scrollY || 0) * 0.06; if (!raf) tick(); };
    const tick = () => {
      ty += (target - ty) * 0.12;
      el.style.setProperty('--hero-y', `${ty}px`);
      raf = Math.abs(target - ty) < 0.2 ? 0 : requestAnimationFrame(tick);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);

  // Headline swap (без изменений)
  useEffect(() => {
    const id = setInterval(() => setWord(w => (w + 1) % words.length), 2000);
    return () => clearInterval(id);
  }, []);

  // Автостарт/восстановление плея (десктопный визуал)
  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    const start = () => v.play().catch(() => {});
    start();
    const onVisibility = () => { if (!document.hidden) start(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const onOpenDeckClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    openDialog();
  };

  return (
    <>
      <section ref={ref} className="hero reveal" style={{ transform: 'translateY(var(--hero-y))' }}>
        <div className="hero__copy">
          <div className="kicker">The mobility layer</div>

          {/* Заголовок: ТОЛЬКО текст. Никакого телефона внутри h1 */}
          <h1>
            {words.map((w, i) => (
              <span key={w} className={`swap ${i === word ? 'swap--in' : ''}`}>{w}</span>
            ))}
            <span> with SaturnusGo</span>
          </h1>

          <p className="lead">
            One app for travel & mobility: order rides, book hotels & spas, save places, buy event tickets — all in one flow.
          </p>

          <div className="cta-row">
            <a className="btn btn-primary btn-ghost" href="#waitlist">Join waitlist</a>
            <a className="btn" href="/investors/">For investors</a>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onOpenDeckClick}
              aria-haspopup="dialog"
            >
              Open deck
            </button>
          </div>
        </div>

        {/* Десктопный большой телефон — как был */}
        <div className="hero__visual" aria-hidden>
          <div className="hero__frame pulse" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div className="phone" style={{ width:'auto', height:'100%', borderRadius: 22, overflow:'hidden' }}>
              <video
                ref={videoRef}
                src="/videos/hero-vision.mp4"
                muted
                playsInline
                autoPlay
                loop
                preload="auto"
                poster="/images/hero-main.png"
                controls={false}
                disablePictureInPicture
                style={{ height:'100%', width:'auto', display:'block' }}
              />
            </div>
          </div>
        </div>
      </section>

      {Dialog}

      {/* Мобильные правки — ТОЛЬКО внутри @media. Десктоп не затрагиваем. */}
      <style jsx>{`
        @media (max-width: 767.98px){
          /* заголовок компактнее и плотнее */
          .hero__copy h1{
            font-size: clamp(22px, 7vw, 28px);
            line-height: 1.12;
            display: inline-flex;
            flex-wrap: wrap;
            gap: .2ch;
            letter-spacing: -0.005em;
            margin: 0 0 6px 0;
          }
          .swap{ margin-right: .1ch; }

          .hero .lead{
            font-size: 14px;
            margin-top: 6px;
          }

          /* кнопки компактнее, чтобы не занимали всю ширину */
          .cta-row{ gap: 8px; }
          .cta-row .btn{
            height: 32px;
            padding: 0 10px;
            font-size: 12.5px;
            border-radius: 999px;
          }

          /* телефонный визуал на мобиле не показываем — он декорация */
          .hero__visual{ display: none !important; }
        }

        /* очень узкие — ещё на полшага компактнее CTA */
        @media (max-width: 420px){
          .cta-row .btn{
            height: 30px;
            padding: 0 9px;
            font-size: 12px;
          }
        }
      `}</style>
    </>
  );
}
