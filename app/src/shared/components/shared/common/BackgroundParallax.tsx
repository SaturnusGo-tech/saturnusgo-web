'use client';
import { useEffect, useRef } from 'react';

/**
 * Fullscreen starfield + Apple-like parallax layers.
 * - 3 глубины звёзд (slow/mid/fast)
 * - рендер 2D Canvas (быстрее, чем WebGL для такого эффекта)
 * - DPR-aware, авто-ресайз, ротация при движении мыши (очень лёгкая)
 * - параллакс-слои реагируют на скролл (translateY) и маус (translate3d)
 * - уважает prefers-reduced-motion
 */
export default function BackgroundParallax({
  enabled = true,
  maxStars = 3200,           // максимум частиц на 1920×1080 при DPR=1
  baseSpeed = 0.02,          // базовая «скорость пролёта»
  parallaxStrength = 18,     // сила параллакса слоёв (px при scroll/1000px)
  mouseTilt = 6              // легкий наклон от мыши (px)
}: {
  enabled?: boolean;
  maxStars?: number;
  baseSpeed?: number;
  parallaxStrength?: number;
  mouseTilt?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const resizeRef = useRef<number>(0);
  const lastTsRef = useRef<number>(0);
  const runningRef = useRef<boolean>(false);
  const reduceMotionRef = useRef<boolean>(false);

  // параллакс-слои
  const layerBackRef = useRef<HTMLDivElement | null>(null);
  const layerMidRef  = useRef<HTMLDivElement | null>(null);

  // буферы звёзд
  type Star = { x: number; y: number; z: number; depth: number };
  const starsRef = useRef<Star[]>([]);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });

  // helpers
  const rnd = (min:number, max:number) => min + Math.random() * (max - min);

  const makeStars = (w:number, h:number, dpr:number) => {
    // плотность с учётом площади
    const area = (w * h) / (1920 * 1080);
    const target = Math.min(maxStars, Math.floor( maxStars * area * (dpr >= 1.5 ? 0.8 : 1) ));
    const arr: Star[] = [];
    for (let i = 0; i < target; i++) {
      const d = Math.random(); // 0..1 → «глубина»
      arr.push({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random(),         // прогресс полёта 0..1
        depth: d < 0.6 ? 0.6 : d  // избегаем совсем «ровных» точек
      });
    }
    return arr;
  };

  const draw = (ts: number) => {
    if (!runningRef.current) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const { w, h, dpr } = sizeRef.current;

    // dt
    if (!lastTsRef.current) lastTsRef.current = ts;
    const dt = Math.min(64, ts - lastTsRef.current);
    lastTsRef.current = ts;

    // фон: прозрачный — мы подложили градиент в CSS
    ctx.clearRect(0, 0, w, h);

    // звёзды
    const stars = starsRef.current;
    const base = reduceMotionRef.current ? 0.005 : baseSpeed;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];

      // скорость зависит от «глубины»
      const speed = base * (0.5 + s.depth * 1.2);
      s.z += (dt * speed) / 1000;
      if (s.z > 1) {
        s.z = 0;
        s.x = Math.random() * w;
        s.y = Math.random() * h;
      }

      // перспектива: чем ближе (z ~ 1), тем больше размер/яркость
      const inv = (s.z * 0.85 + 0.15);  // 0.15..1
      const size = (1.4 + s.depth * 1.8) * inv * dpr;
      const alpha = Math.min(1, 0.15 + s.depth * 0.9) * inv;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(s.x, s.y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    rafRef.current = requestAnimationFrame(draw);
  };

  const resize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.floor(canvas.clientWidth * dpr);
    const h = Math.floor(canvas.clientHeight * dpr);
    if (w === sizeRef.current.w && h === sizeRef.current.h && dpr === sizeRef.current.dpr) return;

    canvas.width = w;
    canvas.height = h;
    sizeRef.current = { w, h, dpr };
    starsRef.current = makeStars(w, h, dpr);
  };

  const onResize = () => {
    if (resizeRef.current) cancelAnimationFrame(resizeRef.current);
    resizeRef.current = requestAnimationFrame(resize);
  };

  // лёгкий параллакс слоёв
  useEffect(() => {
    const onScroll = () => {
      if (!layerBackRef.current || !layerMidRef.current) return;
      const y = window.scrollY || 0;
      const back = Math.round(-y * (parallaxStrength / 100)); // самый дальний
      const mid  = Math.round(-y * (parallaxStrength / 60));
      layerBackRef.current.style.transform = `translate3d(0, ${back}px, 0)`;
      layerMidRef.current.style.transform  = `translate3d(0, ${mid}px, 0)`;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!layerMidRef.current) return;
      const { innerWidth, innerHeight } = window;
      const cx = innerWidth / 2;
      const cy = innerHeight / 2;
      const dx = (e.clientX - cx) / innerWidth;   // -0.5..0.5
      const dy = (e.clientY - cy) / innerHeight;
      const tx = (dx * mouseTilt);
      const ty = (dy * mouseTilt);
      layerMidRef.current.style.transform += ` translate(${tx}px, ${ty}px)`;
    };

    // respect reduced-motion
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reduceMotionRef.current = mq.matches;

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [parallaxStrength, mouseTilt]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;

    // первичная разметка
    resize();

    runningRef.current = true;
    rafRef.current = requestAnimationFrame(draw);

    window.addEventListener('resize', onResize);
    return () => {
      runningRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (resizeRef.current) cancelAnimationFrame(resizeRef.current);
      window.removeEventListener('resize', onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return (
    <>
      {/* Gradient base (слегка «космос») — под канвасом */}
      <div className="bg-gradient" aria-hidden />

      {/* Canvas звёзд */}
      <canvas ref={canvasRef} className="bg-canvas" aria-hidden />

      {/* Параллакс-слои (мягкие «туманности») */}
      <div ref={layerBackRef} className="parallax-layer parallax-back" aria-hidden />
      <div ref={layerMidRef}  className="parallax-layer parallax-mid"  aria-hidden />
    </>
  );
}
